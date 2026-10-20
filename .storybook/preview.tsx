import type { Preview } from "@storybook/react-vite";

export const mockPaseoTheme = {
  colors: {
    surface0: "#11111b",
    surface1: "#181825",
    surface2: "#1e1e2e",
    border: "#313244",
    foreground: "#cdd6f4",
    foregroundMuted: "#a6adc8",
    accent: "#89b4fa",
    accentForeground: "#11111b",
    statusSuccess: "#a6e3a1",
    statusWarning: "#f9e2af",
    statusDanger: "#f38ba8",
  },
};

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: "paseo-dark",
      values: [
        { name: "paseo-dark", value: "#11111b" },
        { name: "light", value: "#ffffff" },
      ],
    },
  },
};

export default preview;
