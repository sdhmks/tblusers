import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Ensure your .env file is correctly set up in your project root.
// It should look like:
// VITE_SUPABASE_URL="https://your-project-id.supabase.co"
// VITE_SUPABASE_ANON_KEY="your-anon-public-key"

// Initialize Supabase Client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Basic check for environment variables (for debugging during development)
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing! Please check your .env file and ensure Vite picks it up (restart dev server).");
  // In a production app, you might render an error message or halt execution
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public', // Explicitly setting schema to 'public'
  },
});

function App() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('list'); // 'list', 'add', 'search'
  const [editingUser, setEditingUser] = useState(null); // Holds user object if editing
  const [userName, setUserName] = useState(''); // Form input for name
  const [userEmail, setUserEmail] = useState(''); // Form input for email
  const [showConfirmModal, setShowConfirmModal] = useState(false); // Controls delete confirmation modal
  const [userToDelete, setUserToDelete] = useState(null); // Stores user to be deleted
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Controls mobile sidebar visibility
  const [searchTerm, setSearchTerm] = useState(''); // State for search input

  // Function to fetch users from Supabase
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .order('id', { ascending: true }); // Order by ID for consistent display

      if (error) throw error;
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // useEffect hook to fetch data when the component mounts
  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtered users for search
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Function to handle form submission (Add or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic validation
    if (!userName.trim() || !userEmail.trim()) {
      setError("Name and Email cannot be empty.");
      setLoading(false);
      return;
    }

    try {
      if (editingUser) {
        // Update existing user
        const { error } = await supabase
          .from('users')
          .update({ name: userName, email: userEmail })
          .eq('id', editingUser.id); // Update where ID matches

        if (error) throw error;
        console.log('User updated successfully!');
      } else {
        // Add new user
        const { error } = await supabase
          .from('users')
          .insert({ name: userName, email: userEmail });

        if (error) throw error;
        console.log('User added successfully!');
      }
      closeForm(); // Close form after submission
      fetchUsers(); // Re-fetch users to update the list
      setCurrentView('list'); // Navigate back to list after adding/editing
    } catch (err) {
      console.error('Error saving user:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to open the form for adding a new user
  const handleAddClick = () => {
    setEditingUser(null); // Clear any editing state
    setUserName('');
    setUserEmail('');
    setCurrentView('add');
    setIsSidebarOpen(false); // Close sidebar on mobile
  };

  // Function to open the form for editing an existing user
  const handleEditClick = (user) => {
    setEditingUser(user); // Set the user to be edited
    setUserName(user.name);
    setUserEmail(user.email);
    setCurrentView('add'); // Use 'add' view for editing as well
    setIsSidebarOpen(false); // Close sidebar on mobile
  };

  // Function to close the form and reset state
  const closeForm = () => {
    setEditingUser(null);
    setUserName('');
    setUserEmail('');
    setError(null); // Clear errors when closing form
    setCurrentView('list'); // Go back to list view
  };

  // Function to prepare for user deletion (open confirmation modal)
  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowConfirmModal(true);
  };

  // Function to confirm and execute user deletion
  const confirmDelete = async () => {
    if (!userToDelete) return;

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userToDelete.id); // Delete where ID matches

      if (error) throw error;
      console.log('User deleted successfully!');
      fetchUsers(); // Re-fetch users to update the list
    } catch (err) {
      console.error('Error deleting user:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
      closeConfirmModal(); // Close confirmation modal
    }
  };

  // Function to close the delete confirmation modal
  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setUserToDelete(null);
    setError(null); // Clear errors when closing modal
  };

  // Conditional rendering for full-screen loading/error states (initial load)
  if (loading && users.length === 0 && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <p className="text-xl text-gray-700">Loading users...</p>
      </div>
    );
  }

  // If there's a global error (e.g., Supabase not configured), show it full screen
  if (error && users.length === 0 && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-100 p-4">
        <p className="text-xl text-red-700 font-semibold">Error: {error}</p>
        <p className="text-md text-red-500 mt-2">Please ensure your Supabase URL and Anon Key are correct and that the 'public' schema is exposed in your Supabase project settings.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex font-inter bg-gray-50"> {/* Removed flex-col and md:flex-row here */}
      {/* Mobile Sidebar Toggle Button (always visible, top-left) */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 left-4 z-50 bg-blue-600 text-white p-2 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          {isSidebarOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
          )}
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 bg-blue-700 p-6 z-40
          transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-0 overflow-hidden'} /* Mobile and desktop transition */
          md:${isSidebarOpen ? 'relative translate-x-0 w-64' : 'absolute -translate-x-full w-0 overflow-hidden'} /* Desktop specific visibility */
          md:flex md:flex-col
        `}
      >
        {/* Only render sidebar content if it's open or actively transitioning to avoid flicker */}
        {isSidebarOpen && (
          <>
            <h2 className="text-2xl font-bold mb-8 text-center text-white">Menu</h2>
            <nav className="flex flex-col space-y-4">
              <button
                onClick={() => { setCurrentView('list'); setIsSidebarOpen(false); }}
                className={`py-3 px-4 rounded-lg text-left transition duration-200 text-gray-100 ${
                  currentView === 'list' ? 'bg-blue-800 shadow-md' : 'hover:bg-blue-600'
                }`}
              >
                List All
              </button>
              <button
                onClick={() => { setCurrentView('search'); setIsSidebarOpen(false); }}
                className={`py-3 px-4 rounded-lg text-left transition duration-200 text-gray-100 ${
                  currentView === 'search' ? 'bg-blue-800 shadow-md' : 'hover:bg-blue-600'
                }`}
              >
                Search
              </button>
              <button
                onClick={handleAddClick}
                className={`py-3 px-4 rounded-lg text-left transition duration-200 text-gray-100 ${
                  currentView === 'add' && !editingUser ? 'bg-blue-800 shadow-md' : 'hover:bg-blue-600'
                }`}
              >
                Add
              </button>
            </nav>
          </>
        )}
      </aside>

      {/* Overlay for mobile when sidebar is open */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content Area */}
      {/* This main content wrapper now has `w-full` and conditional `ml` for sidebar */}
      <div className={`flex-1 flex flex-col items-center w-full min-h-screen
          ${isSidebarOpen ? 'md:ml-64' : 'md:ml-0'} /* Push content if sidebar is open on desktop */
          transition-all duration-300 ease-in-out
      `}>
        <header className="w-full bg-blue-600 text-white p-6 shadow-lg text-center mt-0 pt-16 md:pt-4 rounded-b-lg"> {/* Rounded bottom */}
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"> {/* Inner container for header content */}
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Supabase User Management</h1>
            <p className="text-lg sm:text-xl opacity-90">Create, Read, Update, and Delete users.</p>
          </div>
        </header>

        {/* Localized error display within main content */}
        {error && users.length > 0 && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 w-full max-w-4xl rounded mx-auto px-4 sm:px-6 lg:px-8" role="alert">
            <p className="font-bold">Error:</p>
            <p>{error}</p>
            <p className="text-sm mt-1">Please check your Supabase settings and network connection, or RLS policies.</p>
          </div>
        )}

        <main className="flex-1 w-full flex flex-col items-center px-4 sm:px-6 lg:px-8 py-6"> {/* Added py-6 for overall vertical spacing, adjusted px */}
          <div className="w-full max-w-4xl"> {/* This div acts as the max-width container for the content within main */}
            {currentView === 'list' && (
              <>
                {users.length === 0 && !loading && !error ? (
                  <div className="bg-white p-8 rounded-lg shadow-md text-center text-gray-600 text-xl">
                    <p>No users found in the 'users' table.</p>
                    <p className="mt-2 text-base">Click "Add" in the sidebar to get started!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1 flex flex-col justify-between"
                      >
                        <div>
                          <h2 className="text-xl font-semibold text-blue-700 mb-2">{user.name}</h2>
                          <p className="text-gray-700 text-md truncate mb-2">{user.email}</p>
                          <p className="text-gray-500 text-sm">ID: {user.id}</p>
                        </div>
                        <div className="mt-4 flex space-x-2 justify-end">
                          <button
                            onClick={() => handleEditClick(user)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2 px-4 rounded-full text-sm transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(user)}
                            className="bg-red-500 hover:bg-red-600 text-gray-900 font-bold py-2 px-4 rounded-full text-sm transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-400"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {currentView === 'add' && (
              <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-auto">
                <h2 className="text-2xl font-bold mb-4 text-blue-700 text-center">
                  {editingUser ? 'Edit User' : 'Add New User'}
                </h2>
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
                      Name:
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="mb-6">
                    <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
                      Email:
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200"
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : (editingUser ? 'Update User' : 'Add User')}
                    </button>
                    <button
                      type="button"
                      onClick={closeForm}
                      className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {currentView === 'search' && (
              <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg mx-auto">
                <h2 className="text-2xl font-bold mb-4 text-blue-700 text-center">Search Users</h2>
                <div className="mb-4">
                  <label htmlFor="search" className="block text-gray-700 text-sm font-bold mb-2">
                    Search by Name:
                  </label>
                  <input
                    type="text"
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                    placeholder="Enter name to search"
                  />
                </div>

                {loading ? (
                  <p className="text-center text-gray-600">Searching...</p>
                ) : filteredUsers.length === 0 && searchTerm !== '' ? (
                  <p className="text-center text-gray-600">No users found matching "{searchTerm}".</p>
                ) : filteredUsers.length === 0 && searchTerm === '' ? (
                   <p className="text-center text-gray-600">Enter a name to search for users.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-4 mt-6">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="bg-gray-100 p-4 rounded-lg shadow-sm flex justify-between items-center"
                      >
                        <div>
                          <h3 className="text-lg font-semibold text-blue-600">{user.name}</h3>
                          <p className="text-gray-600 text-sm">{user.email}</p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditClick(user)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-1 px-3 rounded-full text-xs transition duration-300"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(user)}
                            className="bg-red-500 hover:bg-red-600 text-gray-900 font-bold py-1 px-3 rounded-full text-xs transition duration-300"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Delete Confirmation Modal (remains fixed over content) */}
        {showConfirmModal && userToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm text-center">
              <h2 className="text-xl font-bold text-red-600 mb-4">Confirm Deletion</h2>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete user "<strong>{userToDelete.name}</strong>"? This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={confirmDelete}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-5 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-red-400"
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={closeConfirmModal}
                  className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-5 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Section */}
        <footer className="mt-12 w-full max-w-4xl text-center text-gray-500 text-sm px-4 sm:px-6 lg:px-8"> {/* Added px for consistency */}
          <p>&copy; {new Date().getFullYear()} My Responsive CRUD App. Powered by React, Vite, and Supabase.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;