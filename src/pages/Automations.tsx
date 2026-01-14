import { useState } from "react";
import { AutomationsLayout } from "@/components/automations/AutomationsLayout";
import { AutomationsDashboard } from "@/components/automations/AutomationsDashboard";
import { WorkflowBuilder } from "@/components/automations/WorkflowBuilder";
import { TemplatesModal } from "@/components/modals/TemplatesModal";
import { IntegrationsModal } from "@/components/modals/IntegrationsModal";

export default function AutomationsPage() {
  const [view, setView] = useState<"dashboard" | "builder">("dashboard");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isIntegrationsOpen, setIsIntegrationsOpen] = useState(false);

  return (
    <AutomationsLayout>
      {view === "dashboard" ? (
        <AutomationsDashboard
            onCreateClick={() => setIsNewModalOpen(true)}
            onIntegrationClick={() => setIsIntegrationsOpen(true)}
            onCardClick={(id: string) => setView("builder")}
        />
      ) : (
        <div className="h-[calc(100vh-140px)] rounded-xl overflow-hidden border border-border shadow-2xl bg-[#0a0a0a]">
           <WorkflowBuilder onClose={() => setView("dashboard")} />
        </div>
      )}

      {/* Templates Modal */}
      <TemplatesModal 
        open={isNewModalOpen}
        onOpenChange={setIsNewModalOpen}
        onSelect={(templateId) => {
            setIsNewModalOpen(false);
            setView("builder");
        }}
      />

      {/* Integrations Modal */}
      <IntegrationsModal 
        open={isIntegrationsOpen} 
        onOpenChange={setIsIntegrationsOpen} 
      />
    </AutomationsLayout>
  );
}
