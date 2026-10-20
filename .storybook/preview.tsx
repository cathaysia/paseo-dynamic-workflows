import type { Preview } from "@storybook/react-vite";
import { PluginRpcProvider } from "@getpaseo/plugin/client/host";

export const mockPaseoTheme = {
  colors: {
    surface0: "#0d0e15",
    surface1: "#13141f",
    surface2: "#1a1b2b",
    border: "#25273c",
    foreground: "#e2e8f0",
    foregroundMuted: "#8b949e",
    accent: "#38bdf8",
    accentForeground: "#0d0e15",
    statusSuccess: "#10b981",
    statusWarning: "#f59e0b",
    statusDanger: "#f43f5e",
  },
};

const preview: Preview = {
  decorators: [
    (Story) => (
      <PluginRpcProvider
        invoke={async (method: string, input: unknown) => {
          console.log("[Storybook Mock RPC]", method, input);
          return { success: true };
        }}
      >
        <Story />
      </PluginRpcProvider>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    backgrounds: {
      default: "paseo-dark",
      values: [
        { name: "paseo-dark", value: "#0d0e15" },
        { name: "light", value: "#ffffff" },
      ],
    },
  },
};

export default preview;
