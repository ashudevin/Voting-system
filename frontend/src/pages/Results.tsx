import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { getResults } from '../services/api';

// Party colors
const PARTY_COLORS: Record<string, string> = {
  'BJP': '#FF9933',
  'CONGRESS': '#0078D7',
  'AAP': '#1FAA59',
  'NOTA': '#666666',
};

// Define the interface for chart data entries
interface DataEntry {
  title: string;
  value: number;
  color: string;
}

const Results: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [results, setResults] = useState<{ name: string; votes: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalVotes, setTotalVotes] = useState(0);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await getResults();
        setResults(data);
        
        // Calculate total votes
        const total = data.reduce((sum, party) => sum + party.votes, 0);
        setTotalVotes(total);
      } catch (err) {
        setError('Failed to load results. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();

    // Poll for results every 30 seconds
    const intervalId = setInterval(fetchResults, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Create a simple chart representation instead of using the external library
  const renderChart = () => {
    if (totalVotes === 0) {
      return (
        <Typography variant="h6" align="center" color="text.secondary">
          No votes recorded yet
        </Typography>
      );
    }

    return (
      <Box sx={{ 
        width: '100%', 
        height: 300, 
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <Box sx={{
          width: '100%',
          height: '100%',
          position: 'relative',
          borderRadius: '50%',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          {results.map((party, index) => {
            const percentage = (party.votes / totalVotes) * 100;
            if (percentage === 0) return null;
            
            // Create a colored segment for each party with votes
            return (
              <Box
                key={party.name}
                sx={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  background: PARTY_COLORS[party.name] || '#999',
                  clipPath: party.votes === totalVotes 
                    ? 'circle(50% at 50% 50%)' 
                    : `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos((index * 360 / totalVotes) * Math.PI / 180)}% ${50 - 50 * Math.sin((index * 360 / totalVotes) * Math.PI / 180)}%, ${50 + 50 * Math.cos(((index + party.votes) * 360 / totalVotes) * Math.PI / 180)}% ${50 - 50 * Math.sin(((index + party.votes) * 360 / totalVotes) * Math.PI / 180)}%)`,
                }}
              />
            );
          })}
          <Box sx={{
            width: '60%',
            height: '60%',
            borderRadius: '50%',
            background: theme.palette.background.paper,
            zIndex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Typography variant="h6">Total: {totalVotes}</Typography>
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 }, mt: 4 }}>
        <Typography variant="h4" gutterBottom align="center" sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
          Election Results
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" align="center" sx={{ my: 4 }}>
            {error}
          </Typography>
        ) : (
          <>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', md: 'row' }, 
              alignItems: 'center',
              gap: 4, 
              mb: 4 
            }}>
              <Box sx={{ 
                width: { xs: '100%', md: '50%' }, 
                maxWidth: { xs: 300, sm: 350, md: 400 },
                mx: 'auto'
              }}>
                {renderChart()}
              </Box>
              
              <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                <Typography variant="h6" gutterBottom align="center" sx={{ mb: 2 }}>
                  Vote Count
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 2,
                  maxWidth: 400,
                  mx: 'auto'
                }}>
                  {results.map((party) => (
                    <Card 
                      key={party.name} 
                      variant="outlined" 
                      sx={{ 
                        borderColor: PARTY_COLORS[party.name] || '#ddd',
                        borderWidth: 2,
                      }}
                    >
                      <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="h6" sx={{ 
                            color: PARTY_COLORS[party.name],
                            fontWeight: 'bold',
                            fontSize: { xs: '1rem', sm: '1.25rem' }
                          }}>
                            {party.name}
                          </Typography>
                          <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                            {party.votes} {party.votes === 1 ? 'vote' : 'votes'} 
                            {totalVotes > 0 && 
                              ` (${Math.round((party.votes / totalVotes) * 100)}%)`
                            }
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Box>
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Total Votes: {totalVotes}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Results are updated in real-time
              </Typography>
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default Results; 