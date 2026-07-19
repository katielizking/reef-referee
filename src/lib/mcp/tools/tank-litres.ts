import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "calculate_tank_litres",
  title: "Calculate tank volume in litres",
  description: "Compute litres for a rectangular freshwater aquarium given length, width, and height in centimetres.",
  inputSchema: {
    length_cm: z.number().positive(),
    width_cm: z.number().positive(),
    height_cm: z.number().positive(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ length_cm, width_cm, height_cm }) => {
    const litres = (length_cm * width_cm * height_cm) / 1000;
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            { length_cm, width_cm, height_cm, litres: Math.round(litres * 10) / 10 },
            null,
            2,
          ),
        },
      ],
    };
  },
});
