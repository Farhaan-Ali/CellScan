// This script deploys the Akinator quiz database structure to Supabase
// Run with: node deploy-akinator-quiz.js

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL || 'https://bwvffvnetkypwhmpbhzr.supabase.co';
// You need to provide the service role key to make admin-level changes
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is required.');
  console.error('You can get it from the Supabase dashboard -> Project Settings -> API -> service_role key');
  console.error('Set it with: export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

// Create Supabase client with service role key (admin access)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Path to the SQL file
const sqlFilePath = path.resolve(__dirname, '../../akinator_quiz.sql');

// Check if the file exists
if (!fs.existsSync(sqlFilePath)) {
  console.error(`ERROR: SQL file not found: ${sqlFilePath}`);
  process.exit(1);
}

// Read the SQL file
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

// Split the SQL into individual statements for sequential execution
const splitSqlStatements = (sql) => {
  // This is a very basic SQL splitter - might need refinement for complex SQL
  return sql
    .replace(/--.*$/gm, '') // Remove SQL comments
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);
};

// Execute SQL directly using Postgres functions or direct table operations
const deployAkinatorQuiz = async () => {
  try {
    console.log('Deploying Akinator quiz structure...');
    
    // Split the SQL file into individual statements
    const statements = splitSqlStatements(sqlContent);
    console.log(`Found ${statements.length} SQL statements to execute.`);
    
    // Execute each CREATE TABLE statement individually
    // For tables that might already exist, we need direct methods
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`Executing statement ${i+1}/${statements.length}...`);
      
      if (stmt.toUpperCase().includes('CREATE TABLE')) {
        console.log(`  Creating table from statement...`);
        
        // For CREATE TABLE, use direct SQL execution via REST API
        // This is a simpler approach than using RPC
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Prefer': 'resolution=ignore-duplicates,return=representation'
          },
          body: JSON.stringify({
            query: stmt
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.log(`  Warning: Table creation may have failed (possibly already exists): ${errorText}`);
          // Continue anyway - the table might already exist
        } else {
          console.log(`  Table created successfully`);
        }
      } 
      else if (stmt.toUpperCase().includes('INSERT INTO')) {
        // Extract table name from INSERT statement
        const tableNameMatch = stmt.match(/INSERT\s+INTO\s+([^\s(]+)/i);
        if (tableNameMatch && tableNameMatch[1]) {
          const tableName = tableNameMatch[1];
          console.log(`  Inserting data into ${tableName}...`);
          
          // For inserts, we'll use the table API after extracting values
          // This is complex due to varied formats of INSERT statements
          // In a real application, consider using a more robust SQL parser
          
          // Instead, use a direct approach for the specific tables we know
          if (tableName.includes('akinator_decision_tree')) {
            // Extract values from the INSERT statement for decision tree table
            // This is a simplified approach for demo purposes
            console.log(`  Inserting to decision tree table via REST API`);
            await executeInsert(tableName, stmt);
          }
          else if (tableName.includes('akinator_results')) {
            // Extract values from the INSERT statement for results table
            console.log(`  Inserting to results table via REST API`);
            await executeInsert(tableName, stmt);
          }
          else {
            console.log(`  Skipping insert for unknown table: ${tableName}`);
          }
        }
      }
      else if (stmt.toUpperCase().includes('CREATE INDEX')) {
        // For indexes, use direct SQL execution
        console.log(`  Creating index...`);
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify({
            query: stmt
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.log(`  Warning: Index creation may have failed (possibly already exists): ${errorText}`);
          // Continue anyway - the index might already exist
        } else {
          console.log(`  Index created successfully`);
        }
      }
      else {
        console.log(`  Executing generic SQL statement...`);
        // For other statements, try direct execution
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify({
            query: stmt
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.log(`  Warning: Statement execution may have failed: ${errorText}`);
        } else {
          console.log(`  Statement executed successfully`);
        }
      }
    }
    
    // Verify that tables were created
    console.log('\nVerifying created tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .in('table_name', ['akinator_decision_tree', 'akinator_results', 'akinator_responses']);
    
    if (tablesError) {
      console.error('Error verifying tables:', tablesError);
    } else if (tables && tables.length > 0) {
      console.log('Successfully verified the following tables:');
      tables.forEach(table => console.log(`- ${table.table_name}`));
      
      // Instead of looking up exact counts, just verify tables exist
      console.log('\nAkinator quiz database structure deployed successfully!');
      console.log('You may now use these tables in your application.');
    } else {
      console.error('Tables may not have been created. Check permissions or SQL syntax.');
    }
  } catch (error) {
    console.error('Error deploying Akinator quiz:', error);
    process.exit(1);
  }
};

// Helper function to execute an INSERT statement
async function executeInsert(tableName, insertStmt) {
  try {
    // For this demo, instead of parsing complex INSERT statements,
    // we'll use a direct POST to the REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Prefer': 'resolution=ignore-duplicates'
      },
      body: JSON.stringify({
        query: insertStmt
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`  Warning: Insert operation may have failed: ${errorText}`);
    } else {
      console.log(`  Insert operation completed`);
    }
  } catch (error) {
    console.log(`  Error during insert: ${error.message}`);
  }
}

// Run the deployment
deployAkinatorQuiz(); 