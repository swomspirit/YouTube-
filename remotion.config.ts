import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// WebGL needs an OpenGL backend in headless Chrome. "angle" works on most
// machines with a GPU; use "swangle" (software) on servers/CI without one.
Config.setChromiumOpenGlRenderer("angle");
// Render one frame at a time. Parallel WebGL tabs produced corrupted frames
// (blank / missing objects) and were not faster for three.js scenes.
Config.setConcurrency(1);
