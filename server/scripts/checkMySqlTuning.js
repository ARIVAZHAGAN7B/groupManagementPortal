const db = require('../config/db');

async function checkTuning() {
  console.log('======================================================');
  console.log('      GM PORTAL — MYSQL PERFORMANCE TUNING AUDITOR    ');
  console.log('======================================================\n');

  try {
    const [vars] = await db.query(`
      SHOW VARIABLES WHERE Variable_name IN (
        'innodb_buffer_pool_size',
        'max_connections',
        'thread_cache_size',
        'innodb_log_file_size',
        'innodb_flush_log_at_trx_commit',
        'open_files_limit'
      )
    `);

    const varMap = Object.fromEntries(vars.map((v) => [v.Variable_name, v.Value]));

    const [status] = await db.query(`
      SHOW GLOBAL STATUS WHERE Variable_name IN (
        'Threads_connected',
        'Threads_running',
        'Innodb_buffer_pool_reads',
        'Innodb_buffer_pool_read_requests',
        'Uptime'
      )
    `);

    const statusMap = Object.fromEntries(status.map((s) => [s.Variable_name, s.Value]));

    const bufferPoolBytes = Number(varMap.innodb_buffer_pool_size) || 0;
    const bufferPoolMB = (bufferPoolBytes / (1024 * 1024)).toFixed(1);
    const reads = Number(statusMap.Innodb_buffer_pool_reads) || 0;
    const requests = Number(statusMap.Innodb_buffer_pool_read_requests) || 1;
    const hitRate = ((1 - reads / requests) * 100).toFixed(2);

    console.log('CURRENT CONFIGURATION & METRICS:');
    console.table([
      {
        Parameter: 'innodb_buffer_pool_size',
        CurrentValue: `${bufferPoolMB} MB (${bufferPoolBytes} B)`,
        Recommendation: '1536 MB (1.5 GB for 16GB RAM laptop)'
      },
      {
        Parameter: 'max_connections',
        CurrentValue: varMap.max_connections,
        Recommendation: '250 - 300'
      },
      {
        Parameter: 'thread_cache_size',
        CurrentValue: varMap.thread_cache_size,
        Recommendation: '16 - 32'
      },
      {
        Parameter: 'innodb_flush_log_at_trx_commit',
        CurrentValue: varMap.innodb_flush_log_at_trx_commit,
        Recommendation: '2 (for extreme write throughput) or 1 (strict ACID)'
      },
      {
        Parameter: 'Buffer Pool Hit Rate',
        CurrentValue: `${hitRate}%`,
        Recommendation: '> 99.00%'
      },
      {
        Parameter: 'Active Connections',
        CurrentValue: statusMap.Threads_connected,
        Recommendation: '< max_connections'
      }
    ]);

    console.log('\n--- RECOMMENDED ACTIONS FOR 2,000 CONCURRENT USERS ---');
    if (bufferPoolBytes < 500 * 1024 * 1024) {
      console.log('⚠️  innodb_buffer_pool_size is currently only ' + bufferPoolMB + ' MB!');
      console.log('   In MySQL 8.0, you can dynamically increase the buffer pool size online without restarting:');
      console.log('   Run as MySQL root:');
      console.log('   SET GLOBAL innodb_buffer_pool_size = 1610612736; -- (1.5 GB)\n');
      console.log('   To persist permanently across reboots, add to your MySQL "my.ini" file (under [mysqld]):');
      console.log('   [mysqld]');
      console.log('   innodb_buffer_pool_size = 1536M');
      console.log('   max_connections = 250');
      console.log('   thread_cache_size = 16\n');
    } else {
      console.log('✅ InnoDB Buffer Pool size is adequately configured: ' + bufferPoolMB + ' MB');
    }

    process.exit(0);
  } catch (err) {
    console.error('Failed to query MySQL tuning variables:', err);
    process.exit(1);
  }
}

checkTuning();
