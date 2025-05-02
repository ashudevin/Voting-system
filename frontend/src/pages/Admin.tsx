import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
  Button,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  CircularProgress,
  Stack,
  Snackbar,
  Card,
  CardContent
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import PersonIcon from '@mui/icons-material/Person';
import WarningIcon from '@mui/icons-material/Warning';
import RefreshIcon from '@mui/icons-material/Refresh';
import LockIcon from '@mui/icons-material/Lock';
import { 
  getRegisteredVoters, 
  deleteVoter, 
  deleteVote, 
  resetAllVotes, 
  resetSystem 
} from '../services/api';

// Admin credentials
const ADMIN_ID = "adi23";
const ADMIN_PASSWORD = "23";

const Admin: React.FC = () => {
  const [voters, setVoters] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [systemResetDialogOpen, setSystemResetDialogOpen] = useState(false);
  const [selectedVoter, setSelectedVoter] = useState<string | null>(null);
  const [action, setAction] = useState<'delete-voter' | 'delete-vote' | null>(null);
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchVoters();
    }
  }, [isAuthenticated]);

  const handleLogin = () => {
    setLoginError(null);
    
    if (userId === ADMIN_ID && password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      // Store in session storage to maintain login until page refresh
      sessionStorage.setItem('adminAuthenticated', 'true');
    } else {
      setLoginError('Invalid ID or password');
    }
  };

  // Separate handlers for each field
  const handleUserIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserId(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin();
  };

  // Check if already logged in from session storage
  useEffect(() => {
    const authenticated = sessionStorage.getItem('adminAuthenticated');
    if (authenticated === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('adminAuthenticated');
    setUserId('');
    setPassword('');
  };

  const fetchVoters = async () => {
    setLoading(true);
    try {
      const data = await getRegisteredVoters();
      setVoters(data);
    } catch (err: any) {
      setError('Failed to fetch voters. ' + (err.response?.data?.detail || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVoter = (aadharNumber: string) => {
    setSelectedVoter(aadharNumber);
    setAction('delete-voter');
    setDialogOpen(true);
  };

  const handleDeleteVote = (aadharNumber: string) => {
    setSelectedVoter(aadharNumber);
    setAction('delete-vote');
    setDialogOpen(true);
  };

  const confirmAction = async () => {
    setDialogOpen(false);
    setLoading(true);
    setError(null);

    try {
      if (action === 'delete-voter' && selectedVoter) {
        const response = await deleteVoter(selectedVoter);
        setSuccess(`Voter ${selectedVoter} has been deleted successfully.`);
        fetchVoters(); // Refresh the list
      } else if (action === 'delete-vote' && selectedVoter) {
        const response = await deleteVote(selectedVoter);
        setSuccess(`Vote for ${selectedVoter} has been deleted.`);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Operation failed. Please try again.');
    } finally {
      setLoading(false);
      setSelectedVoter(null);
      setAction(null);
    }
  };

  const handleResetVotes = async () => {
    setResetDialogOpen(false);
    setLoading(true);
    setError(null);

    try {
      const response = await resetAllVotes();
      setSuccess('All votes have been reset successfully.');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reset votes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSystemReset = async () => {
    setSystemResetDialogOpen(false);
    setLoading(true);
    setError(null);

    try {
      const response = await resetSystem();
      setSuccess('The entire system has been reset successfully.');
      fetchVoters(); // Refresh the now-empty list
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reset system. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredVoters = voters.filter(voter => 
    voter.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle search input change with validation
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Only allow digits or empty field
    if (value === '' || /^\d+$/.test(value)) {
      setSearchQuery(value);
    }
  };

  // Login form component
  const LoginForm = () => (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <LockIcon sx={{ fontSize: 60, color: 'primary.main' }} />
        </Box>
        <Typography variant="h4" gutterBottom align="center">
          Admin Login
        </Typography>
        
        <Typography variant="body1" paragraph align="center" color="text.secondary" sx={{ mb: 3 }}>
          Please enter your credentials to access the admin panel
        </Typography>

        {loginError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {loginError}
          </Alert>
        )}

        <form onSubmit={handleFormSubmit} noValidate>
          <TextField
            fullWidth
            id="admin-id"
            name="admin-id"
            label="Admin ID"
            variant="outlined"
            value={userId}
            onChange={handleUserIdChange}
            margin="normal"
            inputProps={{
              autoComplete: "username",
              spellCheck: "false"
            }}
            autoFocus
          />
          
          <TextField
            fullWidth
            id="admin-password"
            name="admin-password"
            label="Password"
            variant="outlined"
            type="password"
            value={password}
            onChange={handlePasswordChange}
            margin="normal"
            inputProps={{
              autoComplete: "current-password",
              spellCheck: "false"
            }}
          />
          
          <Button 
            fullWidth
            variant="contained" 
            color="primary"
            size="large" 
            type="submit"
            sx={{ mt: 3, mb: 2 }}
          >
            Login
          </Button>
        </form>
      </Paper>
    </Container>
  );

  // If not authenticated, show login form
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // Admin panel - only shown when authenticated
  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Admin Panel
          </Typography>
          <Button 
            variant="outlined" 
            color="inherit"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Box>
        
        <Typography variant="body1" paragraph color="text.secondary">
          Manage voters and votes in the election system
        </Typography>

        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<RefreshIcon />}
            onClick={fetchVoters}
            disabled={loading}
          >
            Refresh List
          </Button>
          <Button 
            variant="outlined" 
            color="secondary" 
            startIcon={<HowToVoteIcon />}
            onClick={() => setResetDialogOpen(true)}
            disabled={loading}
          >
            Reset All Votes
          </Button>
          <Button 
            variant="outlined" 
            color="error" 
            startIcon={<WarningIcon />}
            onClick={() => setSystemResetDialogOpen(true)}
            disabled={loading}
          >
            Reset System
          </Button>
        </Stack>

        {loading && <CircularProgress sx={{ display: 'block', mx: 'auto', my: 3 }} />}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Search Aadhar Number"
            variant="outlined"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Enter Aadhar number to filter..."
            inputProps={{ 
              inputMode: 'numeric',
              pattern: '[0-9]*'
            }}
            helperText="Enter full or partial Aadhar number to search"
          />
        </Box>

        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Registered Voters: {voters.length}
            </Typography>
            <Divider sx={{ my: 2 }} />
            {voters.length === 0 ? (
              <Typography variant="body1" color="text.secondary" align="center">
                No voters registered in the system
              </Typography>
            ) : filteredVoters.length === 0 ? (
              <Typography variant="body1" color="text.secondary" align="center">
                No voters match your search
              </Typography>
            ) : (
              <List>
                {filteredVoters.map((voter) => (
                  <React.Fragment key={voter}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="body1">{voter}</Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton 
                          edge="end" 
                          aria-label="delete vote" 
                          onClick={() => handleDeleteVote(voter)}
                          sx={{ mr: 1 }}
                        >
                          <HowToVoteIcon color="secondary" />
                        </IconButton>
                        <IconButton 
                          edge="end" 
                          aria-label="delete voter" 
                          onClick={() => handleDeleteVoter(voter)}
                        >
                          <DeleteIcon color="error" />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            )}
          </CardContent>
        </Card>

        {/* Confirmation Dialog for Delete Actions */}
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
        >
          <DialogTitle>
            {action === 'delete-voter' ? 'Delete Voter' : 'Delete Vote'}
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              {action === 'delete-voter' 
                ? `Are you sure you want to delete voter ${selectedVoter}? This will also delete their vote if they have voted.`
                : `Are you sure you want to delete the vote for ${selectedVoter}? The voter will still be registered in the system.`
              }
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)} color="primary">
              Cancel
            </Button>
            <Button onClick={confirmAction} color="error" variant="contained" autoFocus>
              Confirm
            </Button>
          </DialogActions>
        </Dialog>

        {/* Reset Votes Dialog */}
        <Dialog
          open={resetDialogOpen}
          onClose={() => setResetDialogOpen(false)}
        >
          <DialogTitle>Reset All Votes</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to reset all votes? This will delete all voting records from the system, but will keep all registered voters. This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setResetDialogOpen(false)} color="primary">
              Cancel
            </Button>
            <Button onClick={handleResetVotes} color="error" variant="contained" autoFocus>
              Reset All Votes
            </Button>
          </DialogActions>
        </Dialog>

        {/* System Reset Dialog */}
        <Dialog
          open={systemResetDialogOpen}
          onClose={() => setSystemResetDialogOpen(false)}
        >
          <DialogTitle>Reset Entire System</DialogTitle>
          <DialogContent>
            <DialogContentText>
              <Box sx={{ color: 'error.main', display: 'flex', alignItems: 'center', mb: 2 }}>
                <WarningIcon sx={{ mr: 1 }} />
                <Typography variant="subtitle1" fontWeight="bold">
                  WARNING: This is a destructive action
                </Typography>
              </Box>
              This will delete ALL voters, faces, and votes from the system. The entire election system will be reset to its initial state. This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSystemResetDialogOpen(false)} color="primary">
              Cancel
            </Button>
            <Button onClick={handleSystemReset} color="error" variant="contained" autoFocus>
              Reset Entire System
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={() => setSuccess(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>
            {success}
          </Alert>
        </Snackbar>
      </Paper>
    </Container>
  );
};

export default Admin; 