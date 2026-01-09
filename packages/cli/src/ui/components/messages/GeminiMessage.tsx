/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { Text, Box } from 'ink';
import { MarkdownDisplay } from '../../utils/MarkdownDisplay.js';
import { theme } from '../../semantic-colors.js';
import { SCREEN_READER_MODEL_PREFIX } from '../../textConstants.js';
import { useUIState } from '../../contexts/UIStateContext.js';
import { useAlternateBuffer } from '../../hooks/useAlternateBuffer.js';

interface GeminiMessageProps {
  text: string;
  isPending: boolean;
  availableTerminalHeight?: number;
  terminalWidth: number;
}

export const GeminiMessage: React.FC<GeminiMessageProps> = ({
  text,
  isPending,
  availableTerminalHeight,
  terminalWidth,
}) => {
  const { renderMarkdown } = useUIState();
  const prefix = '✦ ';
  const prefixWidth = prefix.length;

  const isAlternateBuffer = useAlternateBuffer();

  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPending && !startTimeRef.current) {
      startTimeRef.current = Date.now();
    } else if (!isPending) {
      startTimeRef.current = null;
    }
  }, [isPending]);

  const getSpeed = () => {
    if (!isPending || !startTimeRef.current || text.length === 0) return 0;
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    if (elapsed < 1) return 0;
    return Math.round((text.length / 4) / elapsed);
  };

  const speed = getSpeed();

  return (
    <Box flexDirection="row">
      <Box width={prefixWidth}>
        <Text color={theme.text.accent} aria-label={SCREEN_READER_MODEL_PREFIX}>
          {prefix}
        </Text>
      </Box>
      <Box flexGrow={1} flexDirection="column">
        <MarkdownDisplay
          text={text}
          isPending={isPending}
          availableTerminalHeight={
            isAlternateBuffer ? undefined : availableTerminalHeight
          }
          terminalWidth={terminalWidth}
          renderMarkdown={renderMarkdown}
        />
        {isPending && speed > 0 && (
          <Text color="gray"> {speed} t/s</Text>
        )}
      </Box>
    </Box>
  );
};
