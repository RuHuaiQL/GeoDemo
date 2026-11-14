# Repository Guidelines

## Project Structure

This static React and TypeScript teaching app has three experiments. `src/App.tsx` switches between lunar phases, eclipse replay, and solar motion. Keep astronomy calculations in `src/science/`, shared experiment state in the Zustand stores under `src/store/`, and rendering in `src/views/`. All three lunar-phase views consume the same result from `calculate(days, solarTime)`. Changing local solar time must leave the phase unchanged.

Store runtime textures in `public/textures/`. Consult `docs/COORDINATES.md` before changing a 3D projection. When a formula or model assumption changes, update the corresponding model document in `docs/` and its unit tests together.

## Build, Test, and Development Commands

Use Node.js 24, the version validated for this project.

- `npm ci` installs dependencies from the lockfile.
- `npm run dev` starts Vite at `http://127.0.0.1:5173`.
- `npm test` runs the Vitest suite once.
- `npm run build` checks strict TypeScript types and generates `dist/`. Use `npm run preview` to serve that build locally over HTTP.
- `npx playwright install chromium` installs the browser for end-to-end tests. Free port 5173 before running `npm run test:e2e` because Playwright starts its own server.

## Deployment

After each application update, run `.\reference\一键更新月相实验室.cmd` once from the repository root. Check the script result and verify the updated application at [the live site](http://203.236.144.27/).

## Coding Style and Naming

Match the surrounding indentation. Use two spaces in multiline science modules such as `solar.ts`. Use PascalCase for React components and types, camelCase for functions and store actions, and uppercase names for model constants such as `SYNODIC_MONTH`. Keep classroom-facing text in Simplified Chinese. Use Tailwind utilities and `src/style.css` for styling. The project has no configured lint or formatting script.

## Testing Guidelines

Place Vitest cases beside the implementation as `*.test.ts`. Run one file with `npm test -- src/science/eclipse.test.ts`. Cover model boundaries such as undefined azimuth at the zenith. There is no configured coverage threshold.

Put browser flows in `tests/*.spec.ts`. Follow the existing role- and label-based selectors. For layout changes, check keyboard controls and narrow viewports. Playwright writes screenshots to `test-results/`.

## Commits and Pull Requests

Git history is unavailable in this checkout. Use a short imperative subject such as `Fix solar noon at polar latitudes`. In a pull request, describe the affected experiment, list the checks run, link any related issue, and include a screenshot for visible changes.
