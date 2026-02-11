import SubscriptionBoxClient from "./subscription-box-client";

export const metadata = {
  title: "Subscription Box | LUMIERE",
  description:
    "Build your custom candle subscription box. Choose your scents, set your frequency, and save.",
};

export default async function SubscriptionBoxPage({ params }) {
  const { boxId } = await params;

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SubscriptionBoxClient boxId={boxId} />
    </div>
  );
}
