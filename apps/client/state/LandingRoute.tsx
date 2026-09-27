import KieliValmisLandingScreen from '../features/kielivalmis/KieliValmisLandingScreen';

type LandingRouteProps = {
  onOpenAuth?: () => void;
};

/**
 * KieliValmis is the customer-facing identity of the Finnish-learning app.
 * Floently remains the parent product family, but the KieliValmis store app
 * should open directly into the Finnish-learning experience rather than the
 * cross-product Floently gateway.
 */
export default function LandingRoute(_props: LandingRouteProps) {
  return <KieliValmisLandingScreen />;
}
