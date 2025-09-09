// Table.js Integration Script - Mengintegrasikan frontend dengan backend tanpa mengubah file frontend
// Script ini akan di-inject ke halaman untuk mengganti data dummy dengan data real dari database

(function() {
  console.log('🚀 Table Integration Script Loaded');
  
  const API_BASE_URL = 'http://localhost:5001';
  
  // Utility functions
  function getAuthToken() {
    return localStorage.getItem('token');
  }
  
  function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
  
  function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 10000;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: all 0.3s ease;
    `;
    
    // Set background color based on type
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
  
  // API functions
  async function fetchTableData() {
    try {
      const token = getAuthToken();
      console.log('📡 Fetching table data from backend...');
      
      const response = await fetch(`${API_BASE_URL}/api/table-data`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ Data fetched successfully:', result.data?.length || 0, 'items');
      return result;
    } catch (error) {
      console.error('❌ Error fetching table data:', error);
      showNotification('Gagal mengambil data dari server', 'error');
      return null;
    }
  }
  
  async function handleTableAction(action, id, data = null) {
    try {
      const token = getAuthToken();
      console.log(`🎯 Handling action: ${action} for ID: ${id}`);
      
      if (!token && (action === 'edit' || action === 'delete')) {
        showNotification('Anda harus login untuk melakukan aksi ini', 'warning');
        return false;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/table-action`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, id, data })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        if (action === 'view') {
          const logbook = result.data;
          const permissionText = result.permissions.canEdit ? 
            '\n\n✏️ Anda dapat mengedit dan menghapus logbook ini' : 
            '\n\n👁️ Anda hanya dapat melihat logbook ini';
          
          alert(`📖 Detail Logbook:\n\n` +
                `Judul: ${logbook.judul_logbook}\n` +
                `Tanggal: ${logbook.tanggal}\n` +
                `Pembuat: ${logbook.nama_pengguna}\n` +
                `Detail: ${logbook.keterangan}` +
                (logbook.link ? `\nLink: ${logbook.link}` : '') +
                permissionText);
        } else if (action === 'delete') {
          showNotification('Data berhasil dihapus!', 'success');
          setTimeout(() => window.location.reload(), 1000);
        } else if (action === 'edit') {
          showNotification('Data berhasil diupdate!', 'success');
          setTimeout(() => window.location.reload(), 1000);
        }
        return true;
      } else {
        showNotification(result.error || 'Terjadi kesalahan', 'error');
        return false;
      }
    } catch (error) {
      console.error('❌ Error handling table action:', error);
      showNotification('Terjadi kesalahan saat memproses aksi', 'error');
      return false;
    }
  }
  
  async function addNewLogbook(logbookData) {
    try {
      const token = getAuthToken();
      console.log('📝 Adding new logbook:', logbookData);
      
      if (!token) {
        showNotification('Anda harus login untuk menambah logbook', 'warning');
        return false;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/add-logbook`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logbookData)
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        showNotification('Logbook berhasil ditambahkan!', 'success');
        setTimeout(() => window.location.reload(), 1000);
        return true;
      } else {
        showNotification(result.error || 'Gagal menambah logbook', 'error');
        return false;
      }
    } catch (error) {
      console.error('❌ Error adding logbook:', error);
      showNotification('Terjadi kesalahan saat menambah logbook', 'error');
      return false;
    }
  }
  
  // Table manipulation functions
  function replaceTableData(realData) {
    const tbody = document.querySelector('tbody');
    if (!tbody) {
      console.log('⚠️ Table body not found');
      return;
    }
    
    console.log('🔄 Replacing table data with', realData.length, 'items from backend');
    
    // Clear existing rows
    tbody.innerHTML = '';
    
    if (realData.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center p-4 text-gray-500">
            Belum ada data logbook
          </td>
        </tr>
      `;
      return;
    }
    
    // Add real data rows
    realData.forEach((row, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="p-2 border">${index + 1}</td>
        <td class="p-2 border">${row.date}</td>
        <td class="p-2 border">${row.nama}</td>
        <td class="p-2 border">${row.judul}</td>
        <td class="p-2 border">${row.keterangan}</td>
        <td class="p-2 border">
          <div class="flex justify-center space-x-2">
            <button class="bg-blue-700 text-white font-medium py-2 px-4 rounded hover:bg-blue-800 transition-colors" 
                    data-action="view" data-id="${row.id}" title="Lihat detail logbook">
              <i class="fas fa-circle-info me-2"></i>View
            </button>
            <button class="font-medium py-2 px-4 rounded transition-colors ${
              row.canEdit 
                ? 'bg-yellow-300 text-black hover:bg-yellow-400' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
            }" 
                    data-action="edit" data-id="${row.id}" ${!row.canEdit ? 'disabled' : ''} 
                    title="${row.canEdit ? 'Edit logbook' : 'Anda hanya bisa edit logbook yang Anda buat'}">
              <i class="fas fa-pen-to-square me-2"></i>Edit
            </button>
            <button class="font-medium py-2 px-4 rounded transition-colors ${
              row.canDelete 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
            }" 
                    data-action="delete" data-id="${row.id}" ${!row.canDelete ? 'disabled' : ''} 
                    title="${row.canDelete ? 'Hapus logbook' : 'Anda hanya bisa hapus logbook yang Anda buat'}">
              <i class="fas fa-trash me-2"></i>Delete
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
    
    // Add event listeners
    tbody.querySelectorAll('button[data-action]').forEach(button => {
      button.addEventListener('click', async (e) => {
        e.preventDefault();
        const action = button.getAttribute('data-action');
        const id = parseInt(button.getAttribute('data-id'));
        const rowData = realData.find(r => r.id === id);
        
        if (button.disabled) return;
        
        if (action === 'view') {
          await handleTableAction('view', id);
        } else if (action === 'edit' && rowData && rowData.canEdit) {
          // Trigger existing edit modal if available
          const editEvent = new CustomEvent('openEditModal', { 
            detail: { 
              id: rowData.id,
              date: rowData.date,
              nama: rowData.nama,
              judul: rowData.judul,
              keterangan: rowData.keterangan
            } 
          });
          document.dispatchEvent(editEvent);
        } else if (action === 'delete' && rowData && rowData.canDelete) {
          if (confirm(`🗑️ Apakah Anda yakin ingin menghapus "${rowData.judul}"?`)) {
            await handleTableAction('delete', id);
          }
        }
      });
    });
    
    console.log('✅ Table data replaced successfully');
  }
  
  // Main integration function
  async function integrateTable() {
    console.log('🔄 Starting table integration...');
    
    const currentUser = getCurrentUser();
    console.log('👤 Current user:', currentUser?.username || 'Anonymous');
    
    // Fetch data from backend
    const tableData = await fetchTableData();
    if (!tableData || !tableData.success) {
      console.log('❌ Failed to fetch table data');
      return;
    }
    
    console.log('📊 Integration results:');
    console.log('- Data entries:', tableData.data.length);
    console.log('- User can edit:', tableData.userCanEdit || 0, 'items');
    
    // Wait for React table to render, then replace with real data
    const maxAttempts = 10;
    let attempts = 0;
    
    const tryReplace = () => {
      attempts++;
      const tbody = document.querySelector('tbody');
      
      if (tbody && (tbody.children.length > 0 || attempts >= maxAttempts)) {
        console.log(`🎯 Attempt ${attempts}: Replacing table data`);
        replaceTableData(tableData.data);
        
        // Show integration status
        if (currentUser) {
          showNotification(`Terhubung sebagai: ${currentUser.username}`, 'success');
        } else {
          showNotification('Mode tamu - login untuk edit/delete', 'info');
        }
      } else if (attempts < maxAttempts) {
        console.log(`⏳ Attempt ${attempts}: Table not ready, retrying...`);
        setTimeout(tryReplace, 500);
      } else {
        console.log('❌ Max attempts reached, table integration failed');
      }
    };
    
    tryReplace();
  }
  
  // Initialize integration
  function initializeIntegration() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', integrateTable);
    } else {
      integrateTable();
    }
    
    // Re-integrate on navigation (SPA support)
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        if (url.includes('/Homepage') || url.includes('table')) {
          console.log('🔄 Navigation detected, re-integrating...');
          setTimeout(integrateTable, 500);
        }
      }
    }).observe(document, { subtree: true, childList: true });
  }
  
  // Global functions for debugging and external access
  window.tableIntegration = {
    fetchData: fetchTableData,
    handleAction: handleTableAction,
    addLogbook: addNewLogbook,
    reinitialize: integrateTable,
    getCurrentUser: getCurrentUser,
    getToken: getAuthToken
  };
  
  // Start integration
  initializeIntegration();
  
  console.log('🎉 Table Integration Script Ready!');
  console.log('💡 Use window.tableIntegration for debugging');
  
})();
