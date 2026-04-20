import fs from 'fs';
import path from 'path';

try {
    const source = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf-8');

    function extractSection(startCmt, endCmt) {
        const start = source.indexOf(startCmt);
        if (start === -1) {
             console.log("Could not find start chunk:", startCmt);
             return '';
        }
        const end = endCmt ? source.indexOf(endCmt, start) : source.length;
        if (end === -1) {
            console.log("Could not find end chunk:", endCmt);
            return source.substring(start);
        }
        return source.substring(start, end).trim();
    }

    const importsBlock = source.substring(0, source.indexOf('// --- Types ---')).trim();
    
    // Adjust imports for depth +2 (from src/pages to src/pages/admin/views)
    let commonImports = importsBlock.split('\n').map(line => {
        if (line.includes("'../") || line.includes('"../')) {
            return line.replace(/\.\.\//g, '../../../');
        }
        return line;
    }).join('\n');
    
    commonImports += `\nimport { Product, OrderItem, Order, Client, Banner, AdminUser, Task, OperationType } from '../types';\nimport { handleFirestoreError, getStatusBadge, getSegmentIcon } from '../utils';\n\n`;

    const typesSection = extractSection('// --- Types ---', '// --- Helper Functions ---');
    let typesOut = typesSection.replace(/interface /g, 'export interface ').replace(/enum /g, 'export enum ');
    
    const helpersSection = extractSection('// --- Helper Functions ---', '// --- Sub-components ---');
    
    // Move OperationType from helpers to types
    const opTypeMatch = helpersSection.match(/enum OperationType \{[\s\S]*?\}/);
    if (opTypeMatch) {
         typesOut += '\n\nexport ' + opTypeMatch[0];
    }
    
    let helpersOut = `import React from 'react';\nimport { CheckCircle2, Clock, Truck, AlertCircle, Package, Flame, Thermometer, Snowflake, CreditCard } from 'lucide-react';\nimport { OperationType } from './types';\n\n` + 
      helpersSection.replace(/enum OperationType \{[\s\S]*?\}/, '')
                    .replace(/function handleFirestoreError/g, 'export function handleFirestoreError')
                    .replace(/const getStatusBadge =/g, 'export const getStatusBadge =')
                    .replace(/const getSegmentIcon =/g, 'export const getSegmentIcon =');

    const v1 = extractSection('// 1. Analytics View', '// 2. Orders View');
    const v2 = extractSection('// 2. Orders View', '// 3. Marketing View');
    const v3 = extractSection('// 3. Marketing View', '// 4. CRM View');
    const v4 = extractSection('// 4. CRM View', '// 5. Product Matrix View');
    const v5 = extractSection('// 5. Product Matrix View', '// 6. Admin Users View');
    const v6 = extractSection('// 6. Admin Users View', '// 7. Import 1C View');
    const v7 = extractSection('// 7. Import 1C View', '// 8. System Logs View');
    const v8 = extractSection('// 8. System Logs View', '// --- Main Layout ---');

    fs.mkdirSync('src/pages/admin/views', { recursive: true });
    
    fs.writeFileSync('src/pages/admin/types.ts', typesOut);
    fs.writeFileSync('src/pages/admin/utils.tsx', helpersOut);

    const exportify = (src) => src.replace(/function ([A-Za-z0-9_]+)\(\) \{/, 'export default function $1() {');

    fs.writeFileSync('src/pages/admin/views/AnalyticsView.tsx', commonImports + exportify(v1));
    fs.writeFileSync('src/pages/admin/views/OrdersView.tsx', commonImports + exportify(v2));
    fs.writeFileSync('src/pages/admin/views/MarketingView.tsx', commonImports + exportify(v3));
    fs.writeFileSync('src/pages/admin/views/CRMView.tsx', commonImports + exportify(v4));
    fs.writeFileSync('src/pages/admin/views/ProductMatrixView.tsx', commonImports + exportify(v5));
    fs.writeFileSync('src/pages/admin/views/AdminUsersView.tsx', commonImports + exportify(v6));
    fs.writeFileSync('src/pages/admin/views/Import1CView.tsx', commonImports + exportify(v7));
    fs.writeFileSync('src/pages/admin/views/SystemLogsView.tsx', commonImports + exportify(v8));

    const layoutMatch = extractSection('// --- Main Layout ---', null);
    
    const layoutImports = `${importsBlock}
import AnalyticsView from './admin/views/AnalyticsView';
import OrdersView from './admin/views/OrdersView';
import MarketingView from './admin/views/MarketingView';
import CRMView from './admin/views/CRMView';
import ProductMatrixView from './admin/views/ProductMatrixView';
import AdminUsersView from './admin/views/AdminUsersView';
import Import1CView from './admin/views/Import1CView';
import SystemLogsView from './admin/views/SystemLogsView';\n\n`;

    fs.writeFileSync('src/pages/AdminDashboard.tsx', layoutImports + layoutMatch);
    
    console.log("Frontend refactoring complete!");
} catch (e) {
    console.error("Error formatting frontend:", e);
}
