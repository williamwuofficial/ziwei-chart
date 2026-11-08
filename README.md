# Zi Wei Chart 紫微斗數

A static Zi Wei Dou Shu (Purple Star Astrology) chart calculator and analyser, hosted on GitHub Pages.

- Enter a birth date, time and place. The time is converted to true solar time.
- The chart shows the main and minor stars, with star and palace names in Chinese.
- The analysis below the chart covers the natal chart and each 10-year period. Every statement comes from a known star configuration, with its source cited.

Everything runs in the browser. Birth data is never sent anywhere. The only network request is the place-name search.

See [PLAN.md](PLAN.md) for the design and research notes.

## Develop

```bash
npm install
npm run dev
npm test
```

## Credits

- Chart engine: [iztro](https://github.com/SylarLong/iztro) (MIT)
- Classical sources: 《紫微斗數》 and 《紫微斗數全書》 (public domain)

For entertainment and cultural interest only.
