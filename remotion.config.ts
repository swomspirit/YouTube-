import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// WebGL needs an OpenGL backend in headless Chrome. "angle" works on most
// machines with a GPU; use "swangle" (software) on servers/CI without one.
Config.setChromiumOpenGlRenderer("angle");
// three.js scenes are GPU-heavy; render fewer frames in parallel.
Config.setConcurrency(2);
