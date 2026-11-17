/**
 * Typed i18n Dictionary Schema for MoonLander
 */

export interface TranslationDictionary {
  common: {
    appName: string;
    tagline: string;
    loading: string;
    save: string;
    cancel: string;
    close: string;
    back: string;
    next: string;
    continue: string;
    confirm: string;
    offline: string;
    online: string;
    updateAvailable: string;
    dismiss: string;
  };
  nav: {
    flightDeck: string;
    academy: string;
    campaign: string;
    dossier: string;
    leaderboard: string;
    crew: string;
    replay: string;
    sandbox: string;
    credits: string;
    privacy: string;
    terms: string;
    aiDisclosure: string;
  };
  stages: {
    stage1Title: string;
    stage2Title: string;
    stage3Title: string;
    stage4Title: string;
    stage5Title: string;
    stage6Title: string;
    objective: string;
    requirements: string;
    design: string;
    launchOrbit: string;
    simulation: string;
    debrief: string;
  };
  hud: {
    catalog: string;
    viewport: string;
    dashboard: string;
    advisor: string;
    telemetry: string;
    deltaV: string;
    mass: string;
    power: string;
    cost: string;
    reliability: string;
    launchReadiness: string;
  };
  descent: {
    altitude: string;
    verticalSpeed: string;
    horizontalSpeed: string;
    fuelRemaining: string;
    tiltAngle: string;
    throttle: string;
    autopilot: string;
    assisted: string;
    manual: string;
    safeZone: string;
    hazardDetected: string;
  };
  settings: {
    title: string;
    audio: string;
    masterVolume: string;
    musicVolume: string;
    sfxVolume: string;
    capcomTts: string;
    closedCaptions: string;
    graphics: string;
    quality: string;
    reducedMotion: string;
    language: string;
  };
}
