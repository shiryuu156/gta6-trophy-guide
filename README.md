[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/shiryuu156/gta6-trophy-guide/rank.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/shiryuu156/gta6-trophy-guide/reward.svg)](https://make.fun/c/gta6-trophy-guide-01)

# Leonida Trophy Guide — GTA VI, all 55 trophies

An offline guide and tracker for every PlayStation 5 trophy of Grand Theft Auto VI, built for the [make.fun GTA 6 trophy guide bounty](https://make.fun/c/gta6-trophy-guide-01).

- **Checklist of all 55 trophies** with official name, description and grade, medal badges and kind chips; progress saved in the browser (localStorage), with export, import and reset.
- **A cited guide for every trophy**, written for this entry in our own words — each with a Sources line naming where its facts come from. Where a description is vague, the guide says so instead of inventing a location or a step.
- **Roadmap to the Platinum** in 7 steps in play order, each with its own progress.
- **Missables watch-list** flagging the 4 trophies whose descriptions read like one-time moments — labelled as our inference, not verified fact.
- **Next Up planner**, counters for the 21 countable trophies, per-trophy notes, search and filters by grade, kind and status, a spoiler setting that hides story trophies until earned, and a dark theme.
- **Fully offline**: static files under `app/`, no build step, no network request at run time.

## Try it

```sh
node serve.ts
```

Then open http://localhost:8080.

## How it is handed in

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to `/output` and writes `/output/dossier.json` with the kit's vendored library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Sources

Trophy names, descriptions and grades are PlayStation's official list, as Exophase and PSNProfiles listed it before this bounty opened (the two agree on every name, description and grade). Every guide is this entry's own words and cites its sources beside it. No Rockstar logo or official artwork is used.

## License

MIT — see [LICENSE](LICENSE).
