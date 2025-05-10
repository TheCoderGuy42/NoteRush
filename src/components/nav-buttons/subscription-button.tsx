import { authClient, useSession } from "@/server/auth/react-client";
import { api } from "@/trpc/react";
import toast from "react-hot-toast";

export function SubscriptonButton() {
  const session = useSession();

  const { data: hasActiveSubscription } =
    api.limits.hasActiveSubscription.useQuery(undefined, {
      enabled: !!session.data,
      refetchOnWindowFocus: true,
    });

  return (
    <>
      {hasActiveSubscription ? (
        <button
          className="text-s cursor-pointer font-mono text-gray-300 transition-colors hover:text-gray-500"
          onClick={() => void handleCancelSubscription()}
        >
          cancel subscription
        </button>
      ) : (
        <button
          className="text-s cursor-pointer font-mono text-gray-300 transition-colors hover:text-gray-500"
          onClick={() => void handleSubscribeClick()}
        >
          go pro
        </button>
      )}
    </>
  );
}

const handleSubscribeClick = async () => {
  try {
    toast.loading("Preparing subscription...", { id: "subscription" });
    const baseUrl = window.location.origin;
    const successUrl = `${baseUrl}`; // success is still the same url
    const cancelUrl = `${baseUrl}`;

    const result = await authClient.subscription.upgrade({
      plan: "pro",
      successUrl,
      cancelUrl,
    });

    if (result.error) {
      console.error("Subscription failed:", result.error);
      toast.error(
        `Subscription failed: ${result.error.message ?? "Unknown error"}`,
        { id: "subscription" },
      );
      return;
    }
    toast.success("Redirecting to payment...", { id: "subscription" });
  } catch (err) {
    console.error("Subscription error:", err);
    toast.error(
      `Subscription error: ${err instanceof Error ? err.message : "Unknown error"}`,
      { id: "subscription" },
    );
  }
};

const handleCancelSubscription = async () => {
  const utils = api.useUtils();

  try {
    toast.loading("Cancelling subscription...", { id: "subscription" });
    const baseUrl = window.location.origin;
    const result = await authClient.subscription.cancel({
      returnUrl: baseUrl,
    });

    if (result.error) {
      console.error("Cancellation failed:", result.error);
      toast.error(
        `Cancellation failed: ${result.error.message ?? "Unknown error"}`,
        { id: "subscription" },
      );
      return;
    }
    toast.success("Subscription cancelled successfully!");
    void utils.limits.hasActiveSubscription.invalidate();
    void utils.limits.isAbovePdfLimit.invalidate();
  } catch (err) {
    console.error("Cancellation error:", err);
    toast.error(
      `Cancellation error: ${err instanceof Error ? err.message : "Unknown error"}`,
      { id: "subscription" },
    );
  }
};
