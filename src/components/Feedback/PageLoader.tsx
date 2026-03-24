import React from 'react';
import { Box, CircularProgress } from '@mui/material';

interface PageLoaderProps {
  height?: string | number;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ height = '80vh' }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height }}>
    <CircularProgress />
  </Box>
);
