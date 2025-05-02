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
  CardContent,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import PersonIcon from '@mui/icons-material/Person';
import WarningIcon from '@mui/icons-material/Warning';
import RefreshIcon from '@mui/icons-material/Refresh';
import LockIcon from '@mui/icons-material/Lock';
import SecurityIcon from '@mui/icons-material/Security';
import { 
  getRegisteredVoters, 
  deleteVoter, 
  deleteVote, 
  resetAllVotes, 
  resetSystem,
  getResults
} from '../services/api';

// Admin credentials
const ADMIN_ID = "adi23";
const ADMIN_PASSWORD = "23";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const Admin: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
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
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [votesData, setVotesData] = useState<{name: string; votes: number}[]>([]);
  
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
  }>({
    open: false,
    title: '',
    message: '',
    action: async () => {},
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const handleLogin = () => {
    setLoginError(null);
    
    if (adminId === ADMIN_ID && password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      // Store in session storage to maintain login until page refresh
      sessionStorage.setItem('adminAuthenticated', 'true');
      fetchData();
    } else {
      setLoginError('Invalid ID or password');
    }
  };

  // Separate handlers for each field
  const handleAdminIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAdminId(e.target.value);
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
    setAdminId('');
    setPassword('');
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch voters and votes data
      const voters = await getRegisteredVoters();
      const results = await getResults();
      
      setVoters(voters);
      setVotesData(results);
    } catch (err: any) {
      setError('Failed to fetch data. ' + (err.response?.data?.detail || ''));
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
        fetchData(); // Refresh the list
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
      fetchData(); // Refresh the now-empty list
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

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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
            value={adminId}
            onChange={handleAdminIdChange}
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
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 }, mt: 4 }}>
        <Typography variant="h4" gutterBottom align="center" sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
          Admin Dashboard
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant={isMobile ? "fullWidth" : "standard"}
            centered={!isMobile}
          >
            <Tab label="Voters Management" />
            <Tab label="System Control" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h6">Registered Voters</Typography>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchData}
              disabled={loading}
              size={isMobile ? "small" : "medium"}
            >
              Refresh
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ my: 2 }}>
              {error}
            </Alert>
          ) : (
            <>
              {isMobile ? (
                // Mobile view - list instead of table
                <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
                  {voters.length > 0 ? (
                    voters.map((voter, index) => (
                      <React.Fragment key={voter}>
                        <ListItem
                          secondaryAction={
                            <IconButton edge="end" onClick={() => handleDeleteVoter(voter)}>
                              <DeleteIcon />
                            </IconButton>
                          }
                        >
                          <ListItemText 
                            primary={`Aadhar: ${voter}`} 
                          />
                        </ListItem>
                        {index < voters.length - 1 && <Divider />}
                      </React.Fragment>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText primary="No registered voters found" />
                    </ListItem>
                  )}
                </List>
              ) : (
                // Desktop view - table
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Sr. No.</TableCell>
                        <TableCell>Aadhar Number</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {voters.length > 0 ? (
                        voters.map((voter, index) => (
                          <TableRow key={voter}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{voter}</TableCell>
                            <TableCell align="right">
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                startIcon={<DeleteIcon />}
                                onClick={() => handleDeleteVoter(voter)}
                              >
                                Delete Voter
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} align="center">
                            No registered voters found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            System Controls
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 3,
            mt: 3
          }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" color="error" gutterBottom>
                  Delete Vote
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Remove a vote from a specific Aadhar number
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' }, 
                  gap: 2, 
                  alignItems: { xs: 'stretch', sm: 'center' }
                }}>
                  <TextField
                    label="Aadhar Number"
                    variant="outlined"
                    placeholder="Enter Aadhar Number"
                    size="small"
                    fullWidth
                    sx={{ flexGrow: 1 }}
                    id="delete-vote-aadhar"
                  />
                  <Button
                    variant="contained"
                    color="error"
                    onClick={() => {
                      const aadhar = (document.getElementById('delete-vote-aadhar') as HTMLInputElement)?.value;
                      if (aadhar) handleDeleteVote(aadhar);
                    }}
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    Delete Vote
                  </Button>
                </Box>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" color="error" gutterBottom>
                  Reset All Votes
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  This will clear all votes, but keep voters registered
                </Typography>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleResetVotes}
                >
                  Reset All Votes
                </Button>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" color="error" gutterBottom>
                  Reset Entire System
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  WARNING: This will delete ALL voters and votes!
                </Typography>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleSystemReset}
                >
                  Reset System
                </Button>
              </CardContent>
            </Card>
          </Box>
        </TabPanel>

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
            onClick={fetchData}
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