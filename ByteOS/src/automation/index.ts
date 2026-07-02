export type AutomationStatus = "idle" | "running" | "failed";

export const automationDefaults = {
  status: "idle" as AutomationStatus,
};
