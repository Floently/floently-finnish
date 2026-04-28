import { Platform } from "react-native";

type BillingPlatform = "ios" | "android";

const PRODUCT_MAPPING: Record<string, string> = {
  yki_monthly: "com.vitusidi.floentlyfinnish.yki.monthly",
  yki_yearly: "com.vitusidi.floentlyfinnish.yki.yearly",
  professional_doctor_monthly: "com.vitusidi.floentlyfinnish.professional.doctor.monthly",
  professional_nurse_monthly: "com.vitusidi.floentlyfinnish.professional.nurse.monthly",
  professional_practical_nurse_monthly: "com.vitusidi.floentlyfinnish.professional.practical_nurse.monthly",
  bundle_doctor_monthly: "com.vitusidi.floentlyfinnish.bundle.doctor.monthly",
  bundle_nurse_monthly: "com.vitusidi.floentlyfinnish.bundle.nurse.monthly",
  bundle_practical_nurse_monthly: "com.vitusidi.floentlyfinnish.bundle.practical_nurse.monthly",
};

function mobilePlatform(): BillingPlatform | null {
  if (Platform.OS === "ios") return "ios";
  if (Platform.OS === "android") return "android";
  return null;
}

export function supportsStoreBilling(): boolean {
  return mobilePlatform() !== null;
}

export async function startStorePurchase(planId: string): Promise<{ status: "pending_configuration"; productId: string; platform: BillingPlatform }> {
  const platform = mobilePlatform();
  if (!platform) {
    throw new Error("Store billing is only available on iOS and Android.");
  }
  const productId = PRODUCT_MAPPING[planId];
  if (!productId) {
    throw new Error("This plan is not available for in-app purchase.");
  }
  return {
    status: "pending_configuration",
    productId,
    platform,
  };
}

