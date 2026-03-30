const LeadsAPI = {
    STORAGE_KEY: 'mahalaxmi_leads',

    getAllLeads: function() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    },

    saveLeads: function(leads) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(leads));
    },

    updateLead: function(id, updates) {
        const leads = this.getAllLeads();
        const index = leads.findIndex(l => l.id === id);
        if (index !== -1) {
            leads[index] = { ...leads[index], ...updates };
            this.saveLeads(leads);
            return true;
        }
        return false;
    },

    deleteLead: function(id) {
        const leads = this.getAllLeads().filter(l => l.id !== id);
        this.saveLeads(leads);
    },

    exportToCSV: function() {
        const leads = this.getAllLeads();
        if (leads.length === 0) return;

        const headers = ["ID", "Timestamp", "Source", "Name", "Phone", "Email", "Message", "Status", "Comments"];
        const rows = leads.map(l => [
            l.id,
            l.timestamp,
            l.form_name,
            l.data.name || '',
            l.data.phone || l.data.mobile || '',
            l.data.email || '',
            (l.data.message || '').replace(/\n/g, ' '),
            l.status,
            (l.comments || '').replace(/\n/g, ' ')
        ]);

        let csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `mahalaxmi_leads_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
