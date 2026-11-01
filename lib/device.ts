const SYSTEMS: [RegExp, string][] = [
  [/iPhone/, "iPhone"],
  [/iPad/, "iPad"],
  [/Android/, "Android"],
  [/Windows/, "Windows"],
  [/Macintosh|Mac OS X/, "Mac"],
  [/Linux/, "Linux"],
];

// Order matters: Edge and Samsung also say Chrome, and every Chromium says Safari.
const BROWSERS: [RegExp, string][] = [
  [/Edg(e|A|iOS)?\//, "Edge"],
  [/SamsungBrowser\//, "Samsung Internet"],
  [/Firefox\/|FxiOS\//, "Firefox"],
  [/Chrome\/|CriOS\//, "Chrome"],
  [/Safari\//, "Safari"],
];

/** A short French label for a user-agent, such as « iPhone · Safari ». */
export function describeDevice(ua: string | null): string {
  const system = ua ? SYSTEMS.find(([re]) => re.test(ua))?.[1] : undefined;
  const browser = ua ? BROWSERS.find(([re]) => re.test(ua))?.[1] : undefined;
  if (!system || !browser) return "Appareil inconnu";
  return `${system} · ${browser}`;
}
