const fs = require('fs');
const path = require('path');

const htmlToInject = `
            <% if (typeof colegios !== 'undefined' && colegios.length > 0) { %>
            <div class="ms-auto d-flex align-items-center">
                <form action="/cambiar-colegio" method="POST" class="m-0">
                    <select name="id_colegio" class="form-select form-select-sm bg-dark text-white border-secondary" style="min-width:180px;" onchange="this.form.submit()">
                        <% colegios.forEach(c => { %>
                            <option value="<%= c.id_colegio %>" <%= colegio_actual && colegio_actual.id_colegio === c.id_colegio ? 'selected' : '' %>><%= c.nombre_colegio %></option>
                        <% }) %>
                    </select>
                </form>
            </div>
            <% } %>
`;

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('action="/cambiar-colegio"')) return; // Ya inyectado
    
    // Find </nav>
    const navEndIndex = content.indexOf('</nav>');
    if (navEndIndex === -1) return;
    
    // Find the closest </div> before </nav>
    const beforeNavEnd = content.substring(0, navEndIndex);
    const lastDivIndex = beforeNavEnd.lastIndexOf('</div>');
    
    if (lastDivIndex !== -1) {
        content = content.slice(0, lastDivIndex) + htmlToInject + content.slice(lastDivIndex);
        fs.writeFileSync(filePath, content);
        console.log('Injected in', filePath);
    }
}

function searchFiles(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            searchFiles(fullPath);
        } else if (fullPath.endsWith('.ejs')) {
            processFile(fullPath);
        }
    });
}
searchFiles(path.join(__dirname, 'views'));
