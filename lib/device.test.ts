import { describeDevice } from "./device";

const UA = {
  iphoneSafari:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  ipad: "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  androidChrome:
    "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36",
  samsung:
    "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36",
  edge: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0",
  winFirefox: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0",
  macChrome:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  iosChrome:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.54 Mobile/15E148 Safari/604.1",
};

describe("describeDevice", () => {
  it.each([
    [UA.iphoneSafari, "iPhone · Safari"],
    [UA.ipad, "iPad · Safari"],
    [UA.androidChrome, "Android · Chrome"],
    [UA.samsung, "Android · Samsung Internet"],
    [UA.edge, "Windows · Edge"],
    [UA.winFirefox, "Windows · Firefox"],
    [UA.macChrome, "Mac · Chrome"],
    [UA.iosChrome, "iPhone · Chrome"],
  ])("names %s", (ua, expected) => {
    expect(describeDevice(ua)).toBe(expected);
  });

  it("admits not knowing", () => {
    expect(describeDevice(null)).toBe("Appareil inconnu");
    expect(describeDevice("curl/8.5.0")).toBe("Appareil inconnu");
  });
});
