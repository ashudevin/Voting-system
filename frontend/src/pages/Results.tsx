import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Button,
  Stack,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import { getResults, Party } from '../services/api';

// Party colors
const PARTY_COLORS: Record<string, string> = {
  'BJP': '#FF9933',
  'CONGRESS': '#0078D7',
  'AAP': '#1FAA59',
  'NOTA': '#666666',
};

const Results: React.FC = () => {
  const [results, setResults] = useState<Party[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalVotes, setTotalVotes] = useState(0);

  const fetchResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getResults();
      setResults(data);
      const total = data.reduce((sum, party) => sum + party.votes, 0);
      setTotalVotes(total);
    } catch (err: any) {
      setError('Failed to fetch results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const handleRefresh = () => {
    fetchResults();
  };

  const getPercentage = (votes: number) => {
    if (totalVotes === 0) return 0;
    return (votes / totalVotes) * 100;
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Election Results
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        {loading && <LinearProgress sx={{ mb: 3 }} />}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Overall Statistics
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body1">
              Total Votes Cast: <strong>{totalVotes}</strong>
            </Typography>
            <Typography variant="body1">
              Parties: <strong>{results.length}</strong>
            </Typography>
          </CardContent>
        </Card>

        {results.length > 0 ? (
          <>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Vote Distribution
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={2}>
                {results
                  .sort((a, b) => b.votes - a.votes)
                  .map((party) => (
                    <Box key={party.name} sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body1">{party.name}</Typography>
                        <Typography variant="body1">
                          {party.votes} votes ({getPercentage(party.votes).toFixed(1)}%)
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={getPercentage(party.votes)}
                        sx={{
                          height: 10,
                          borderRadius: 5,
                          bgcolor: '#e0e0e0',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: PARTY_COLORS[party.name] || '#1976d2',
                            borderRadius: 5,
                          },
                        }}
                      />
                    </Box>
                  ))}
              </Stack>
            </Box>

            <TableContainer component={Paper} sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ p: 2 }}>
                Detailed Results
              </Typography>
              <Divider />
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Rank</TableCell>
                    <TableCell>Party</TableCell>
                    <TableCell align="right">Votes</TableCell>
                    <TableCell align="right">Percentage</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results
                    .sort((a, b) => b.votes - a.votes)
                    .map((party, index) => (
                      <TableRow key={party.name}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: PARTY_COLORS[party.name] || '#1976d2',
                                mr: 1,
                              }}
                            />
                            {party.name}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{party.votes}</TableCell>
                        <TableCell align="right">
                          {getPercentage(party.votes).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 5 }}>
            <EqualizerIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No votes have been cast yet
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Results will appear here once people start voting
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Results; 