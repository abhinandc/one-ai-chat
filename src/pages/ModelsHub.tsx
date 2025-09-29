import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
import { useModels } from "@/hooks/useModels";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useVirtualKeys } from "@/hooks/useSupabaseData";

const ModelsHub = () => {
  const user = useCurrentUser();
  const { models, loading, error, refetch } = useModels();
  const { data: virtualKeys, loading: keysLoading } = useVirtualKeys(user?.email);

  const groupedByProvider = useMemo(() => {
    const groups = new Map<string, typeof models>();
    models.forEach((model) => {
      const provider = model.metadata?.provider ?? model.owned_by ?? "unknown";
      if (!groups.has(provider)) {
        groups.set(provider, []);
      }
      groups.get(provider)?.push(model);
    });
    return Array.from(groups.entries());
  }, [models]);

  return (
    <div className="h-full bg-background overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-xl p-lg">
        <div className="flex items-center justify-between gap-md">
          <div className="space-y-xs">
            <h1 className="text-3xl font-semibold text-text-primary font-display">Models & Access</h1>
            <p className="text-text-secondary">
              The catalog below reflects the models exposed by the OneAI Admin proxy. Paste the virtual key that was
              issued to you to run completions.
            </p>
          </div>
          <div className="flex gap-sm">
            <Button variant="outline" onClick={() => refetch()} disabled={loading}>
              Refresh
            </Button>
            <Button onClick={() => window.dispatchEvent(new CustomEvent('open-api-keys'))}>
              Manage API Keys
            </Button>
          </div>
        </div>

        <section className="space-y-md">
          <h2 className="text-xl font-semibold text-text-primary">Your Virtual Keys</h2>
          {keysLoading ? (
            <GlassCard className="p-lg text-sm text-text-secondary">Loading key assignments?</GlassCard>
          ) : virtualKeys.length === 0 ? (
            <GlassCard id="api-keys" className="p-lg text-sm text-text-secondary">
              No virtual keys were found for {user?.email ?? 'your account'}. Use the OneAI Admin portal to issue a key
              and paste it here.
            </GlassCard>
          ) : (
            <div className="grid gap-md">
              {virtualKeys.map((key) => (
                <GlassCard key={key.id} className="p-lg">
                  <div className="flex items-center justify-between gap-md">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{key.label || 'Virtual Key'}</p>
                      <p className="text-xs text-text-tertiary mt-xs">Budget: {key.budgetUsd ?? '?'} USD ? Models assigned: {key.models.length}</p>
                    </div>
                    <Badge variant={key.disabled ? 'destructive' : 'secondary'}>
                      {key.disabled ? 'Disabled' : 'Active'}
                    </Badge>
                  </div>
                  {key.models.length > 0 && (
                    <div className="mt-sm flex flex-wrap gap-2">
                      {key.models.map((model) => (
                        <Badge key={model} variant="outline" className="text-xs">
                          {model}
                        </Badge>
                      ))}
                    </div>
                  )}
                </GlassCard>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-md">
          <h2 className="text-xl font-semibold text-text-primary">Model Catalog</h2>
          {loading ? (
            <GlassCard className="p-lg text-sm text-text-secondary">Loading models?</GlassCard>
          ) : error ? (
            <GlassCard className="p-lg text-sm text-accent-orange bg-accent-orange/10 border-accent-orange/40">
              {error}
            </GlassCard>
          ) : models.length === 0 ? (
            <GlassCard className="p-lg text-sm text-text-secondary">
              No models are currently exposed. Check back after an administrator publishes them.
            </GlassCard>
          ) : (
            <div className="space-y-lg">
              {groupedByProvider.map(([provider, providerModels]) => (
                <div key={provider} className="space-y-md">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-text-primary capitalize">{provider}</h3>
                    <span className="text-xs text-text-tertiary">{providerModels.length} model(s)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                    {providerModels.map((model) => (
                      <GlassCard key={model.id} className="p-lg space-y-md hover:border-accent-blue/30 transition-colors">
                        <div className="flex items-start justify-between gap-md">
                          <div>
                            <h4 className="font-semibold text-text-primary">{model.id}</h4>
                            <p className="text-xs text-text-tertiary uppercase tracking-wide">{model.object}</p>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {model.metadata?.maxTokens ? `${model.metadata.maxTokens} tokens` : 'Context flexible'}
                          </Badge>
                        </div>
                        {model.metadata?.description && (
                          <p className="text-sm text-text-secondary leading-relaxed">
                            {model.metadata.description}
                          </p>
                        )}
                        <div className="text-xs text-text-tertiary space-y-xs">
                          <p>
                            <span className="font-medium text-text-secondary">Endpoint:</span>{' '}
                            {model.metadata?.endpoint ?? 'Managed by proxy'}
                          </p>
                          <p>
                            <span className="font-medium text-text-secondary">Owned by:</span>{' '}
                            {model.owned_by}
                          </p>
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ModelsHub;
