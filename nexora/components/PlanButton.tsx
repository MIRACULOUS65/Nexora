"use client"

import { useAuth } from '@clerk/nextjs';
import { SubscriptionDetailsButton, useSubscription } from '@clerk/nextjs/experimental';
import React, { useEffect, useState } from 'react'
import { useUpgradeDialog } from './UpgradeDialog';
import { getActivePromptUsage } from '@/actions/usage';

type Usage = Awaited<ReturnType<typeof getActivePromptUsage>>;
const USAGE_CHANGED_EVENT = "outpost:prompt-usage-changed";

export function refreshPromptUsage() {
    window.dispatchEvent(new Event(USAGE_CHANGED_EVENT));
}

const PlanButton = ({ upgradeOnlyWhenOut = false }: { upgradeOnlyWhenOut?: boolean }) => {

    const { orgId, has } = useAuth();
    const payerType = orgId ? "organization" : "user";
    const { data: subscription } = useSubscription({ for: payerType });
    const openUpgrade = useUpgradeDialog();
    const [usage, setUsage] = useState<Usage>(null);

    useEffect(() => {
        let cancelled = false;

        const load = () =>
            getActivePromptUsage().then((next) => !cancelled && setUsage(next));

        load();
        window.addEventListener(USAGE_CHANGED_EVENT, load);

        return () => {
            cancelled = true;
            window.removeEventListener(USAGE_CHANGED_EVENT, load);
        };
    }, [orgId]);

    if (!usage) return null;

    const { used, limit, isPaid } = usage;
    const isOut = used >= limit;


    const planName =
        subscription?.subscriptionItems.find(
            (item) => item.status === "active" && !item.plan.isDefault,
        )?.plan.name ?? "Free";



    // const paidPlan = subscription?.subscriptionItems.find((item) => item.status === "active" && !item.plan.isDefault,)?.plan;

    const upgrade = () =>
        openUpgrade({
            title: isOut ? "You're out of agent prompts" : "Get more agent prompts",
            description: `You've used ${used} of ${limit} prompts this month. Upgrade for more.`,
        });


  const usageButton = (
    <button
      type="button"
      title={`${used.toLocaleString()} of ${limit.toLocaleString()} agent prompts used this month`}
      onClick={isPaid ? undefined : upgrade}
      className="flex h-full items-center gap-2.5 px-3 transition-colors hover:bg-white/5"
    >
      <span className="font-medium text-foreground">{planName}</span>
      <span className="h-1 w-12 overflow-hidden rounded-full bg-white/10">
        <span
          className={`block h-full rounded-full ${isOut ? "bg-destructive" : "bg-primary"}`}
          style={{ width: `${Math.min(100, (used / limit) * 100)}%` }}
        />
      </span>
      <span className="text-muted-foreground tabular-nums">
        {used.toLocaleString()}/{limit.toLocaleString()}
      </span>
    </button>
  );

    const canManage = isPaid && (!orgId || has?.({ permission: "org:sys_billing:manage" }));

    return (
        <div className="flex h-8 items-center overflow-hidden rounded-full border border-white/10 bg-white/10 text-xs">
            {canManage ? (
                <SubscriptionDetailsButton for={payerType}>
                    {usageButton}
                </SubscriptionDetailsButton>
            ) : (
                usageButton
            )}

            {!isPaid && (!upgradeOnlyWhenOut || isOut)&& (
                <button
                    type="button"
                    onClick={() => openUpgrade()}
                    className="h-full border-1 border-white/10 px-3 font-medium text-primary transition-colors hover:bg-primary/5">
                    Upgrade
                </button>
            )}
        </div>
    )

}

export default PlanButton
