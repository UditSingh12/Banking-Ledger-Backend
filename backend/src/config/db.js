const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Server is connected to DB');

    // ── Fail-fast: require replica set / sharded cluster ─────────────────
    // Mongoose transactions are only supported on replica sets and sharded
    // clusters. A standalone MongoDB will silently connect but fail at the
    // first money-moving operation. We check at startup and crash loudly.
    const adminDb = mongoose.connection.db.admin();
    const { ismaster } = await adminDb.command({ isMaster: 1 });

    // A replica set member reports `ismaster` and exposes `setName`.
    // A sharded mongos exposes `msg: "isdbgrid"`.
    const isReplicaSet = !!ismaster?.setName || !!ismaster?.msg;

    // Re-check using the full isMaster response object
    const isMasterFull = await adminDb.command({ isMaster: 1 });
    const hasReplicaSet = !!isMasterFull.setName || isMasterFull.msg === 'isdbgrid';

    if (!hasReplicaSet) {
      console.error(
        '\n[FATAL] MongoDB is running as a standalone instance.\n' +
        '        Mongoose transactions require a replica set or sharded cluster.\n' +
        '        For local dev, run: docker compose up -d\n' +
        '        Then set MONGO_URI=mongodb://localhost:27017/backend-ledger?replicaSet=rs0\n'
      );
      process.exit(1);
    }

    console.log(`[DB] Replica set confirmed: ${isMasterFull.setName || 'sharded cluster'}`);

  } catch (err) {
    console.error('Error while connecting to DB:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;