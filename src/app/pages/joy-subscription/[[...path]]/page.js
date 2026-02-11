import CustomerPortalClient from "./customer-portal-client";

export const metadata = {
  title: "My Subscriptions | LUMIERE",
  description: "Manage your LUMIERE subscriptions, update delivery schedule, and more.",
};

export default function SubscriptionManagementPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <CustomerPortalClient />
    </div>
  );
}
