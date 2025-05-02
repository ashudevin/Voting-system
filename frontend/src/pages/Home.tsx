import React from 'react';
import { Container, Typography, Paper, Grid, Button, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EqualizerIcon from '@mui/icons-material/Equalizer';

const Home: React.FC = () => {
  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Welcome to Smart Election System
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          A modern, secure voting platform using facial recognition technology
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 2 }}>
        <Box sx={{ width: { xs: '100%', md: '30%' }, flex: 1 }}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transition: '0.3s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 6,
              },
            }}
          >
            <PersonAddIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" component="h2" gutterBottom>
              Register
            </Typography>
            <Typography variant="body1" paragraph align="center">
              New voters can register with their Aadhar number and facial data
            </Typography>
            <Button
              variant="contained"
              component={Link}
              to="/register"
              sx={{ mt: 'auto' }}
              startIcon={<PersonAddIcon />}
            >
              Register Now
            </Button>
          </Paper>
        </Box>

        <Box sx={{ width: { xs: '100%', md: '30%' }, flex: 1 }}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transition: '0.3s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 6,
              },
            }}
          >
            <HowToVoteIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" component="h2" gutterBottom>
              Vote
            </Typography>
            <Typography variant="body1" paragraph align="center">
              Cast your vote securely using facial recognition for authentication
            </Typography>
            <Button
              variant="contained"
              component={Link}
              to="/vote"
              sx={{ mt: 'auto' }}
              startIcon={<HowToVoteIcon />}
            >
              Vote Now
            </Button>
          </Paper>
        </Box>

        <Box sx={{ width: { xs: '100%', md: '30%' }, flex: 1 }}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transition: '0.3s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 6,
              },
            }}
          >
            <EqualizerIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" component="h2" gutterBottom>
              Results
            </Typography>
            <Typography variant="body1" paragraph align="center">
              View real-time election results with detailed statistics
            </Typography>
            <Button
              variant="contained"
              component={Link}
              to="/results"
              sx={{ mt: 'auto' }}
              startIcon={<EqualizerIcon />}
            >
              See Results
            </Button>
          </Paper>
        </Box>
      </Box>

      <Box sx={{ mt: 6, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Why Use Smart Election System?
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Our system uses advanced facial recognition to ensure secure voting, 
          prevent double voting, and provide instant, transparent results.
        </Typography>
      </Box>
    </Container>
  );
};

export default Home; 