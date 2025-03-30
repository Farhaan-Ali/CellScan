import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Try to load environment variables
try {
  dotenv.config();
} catch (error) {
  console.log('No .env file found, using defaults and environment variables');
}

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL || 'https://bwvffvnetkypwhmpbhzr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is required.');
  console.error('You can get it from the Supabase dashboard -> Project Settings -> API -> service_role key');
  console.error('Set it with: export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

// Create Supabase client with admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Manual setup function using the Supabase client API directly
async function setupAkinatorTables() {
  console.log('Setting up Akinator quiz tables...');
  
  try {
    // Instead of executing SQL, we'll use direct Supabase client calls
    // to check if tables exist, create them if they don't, and insert data
    
    // Check if tables already exist
    console.log('Checking if tables already exist...');
    const { data: existingTables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .in('table_name', ['akinator_decision_tree', 'akinator_results', 'akinator_responses']);
      
    if (checkError) {
      console.error('Error checking tables:', checkError);
      return;
    }
    
    const existingTableNames = existingTables ? existingTables.map(t => t.table_name) : [];
    console.log('Existing tables:', existingTableNames.join(', ') || 'None');
    
    // We cannot create tables directly with the JS client, but we can insert data
    // Let's try to insert some test data to see if tables are accessible
    if (existingTableNames.includes('akinator_decision_tree')) {
      console.log('Testing decision tree table...');
      const { data: testData, error: testError } = await supabase
        .from('akinator_decision_tree')
        .select('id')
        .limit(1);
        
      if (testError) {
        console.error('Error accessing decision tree table:', testError);
      } else {
        console.log('Decision tree table is accessible');
        
        // Add a root question if it doesn't exist
        const { data: rootQuestion, error: rootCheckError } = await supabase
          .from('akinator_decision_tree')
          .select('id')
          .eq('is_root', true)
          .limit(1);
          
        if (rootCheckError) {
          console.error('Error checking root question:', rootCheckError);
        } else if (!rootQuestion || rootQuestion.length === 0) {
          console.log('No root question found. Adding one...');
          
          // Insert a root question
          const { error: insertError } = await supabase
            .from('akinator_decision_tree')
            .insert({
              question_text: 'Which type of cancer are you concerned about?',
              question_type: 'select',
              options: { options: ['Breast Cancer', 'Skin Cancer', 'Lung Cancer'] },
              is_root: true,
              symptom_category: null,
              next_question_mapping: {
                'Breast Cancer': 2,
                'Skin Cancer': 3,
                'Lung Cancer': 4
              },
              risk_score_modifier: 0
            });
            
          if (insertError) {
            console.error('Error inserting root question:', insertError);
          } else {
            console.log('Root question added successfully');
          }
        } else {
          console.log('Root question already exists');
        }
      }
    } else {
      console.log('Decision tree table does not exist - you need to run SQL commands to create it');
    }
    
    // Check if results table exists and test it
    if (existingTableNames.includes('akinator_results')) {
      console.log('Testing results table...');
      const { data: testResults, error: testResultsError } = await supabase
        .from('akinator_results')
        .select('id')
        .limit(1);
        
      if (testResultsError) {
        console.error('Error accessing results table:', testResultsError);
      } else {
        console.log('Results table is accessible');
        
        // Add a test result if the table is empty
        if (!testResults || testResults.length === 0) {
          console.log('No results found. Adding a test result...');
          
          // Insert a test result
          const { error: insertResultError } = await supabase
            .from('akinator_results')
            .insert({
              condition_name: 'Test Condition',
              description: 'This is a test condition',
              risk_level: 'Low',
              min_score: 0,
              max_score: 10,
              recommendation: 'This is a test recommendation',
              followup_actions: ['Test action 1', 'Test action 2'],
              sources: ['Test source']
            });
            
          if (insertResultError) {
            console.error('Error inserting test result:', insertResultError);
          } else {
            console.log('Test result added successfully');
          }
        } else {
          console.log('Results table already has data');
        }
      }
    } else {
      console.log('Results table does not exist - you need to run SQL commands to create it');
    }
    
    // Check if responses table exists and test it
    if (existingTableNames.includes('akinator_responses')) {
      console.log('Testing responses table...');
      const { data: testResponses, error: testResponsesError } = await supabase
        .from('akinator_responses')
        .select('id')
        .limit(1);
        
      if (testResponsesError) {
        console.error('Error accessing responses table:', testResponsesError);
      } else {
        console.log('Responses table is accessible');
      }
    } else {
      console.log('Responses table does not exist - you need to run SQL commands to create it');
    }
    
    // Print final status
    console.log('\nAkinator table check complete.');
    console.log('If tables do not exist, please create them using SQL commands directly in the Supabase dashboard.');
    console.log('You can copy the SQL from src/akinator_quiz.sql and execute it in the Supabase SQL Editor.');
    
  } catch (error) {
    console.error('Error setting up Akinator tables:', error);
  }
}

// Run the setup
setupAkinatorTables(); 