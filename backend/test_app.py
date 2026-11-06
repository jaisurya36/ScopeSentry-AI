import asyncio
from app.main import app
from app.database.connection import engine, Base, AsyncSessionLocal
from app.api.demo import setup_demo_scenario
from app.api.dashboard import get_dashboard_stats

async def run_tests():
    # 1. Initialize tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("[OK] Database tables initialized")

    # 2. Run Demo Scenario Setup
    async with AsyncSessionLocal() as session:
        demo_result = await setup_demo_scenario(session)
        print("[OK] Demo scenario setup executed successfully:")
        print(f"  Client ID: {demo_result['client_id']}")
        print(f"  Project ID: {demo_result['project_id']}")
        print(f"  Agreement ID: {demo_result['agreement_id']}")
        print(f"  Bank ID: {demo_result['bank_id']}")
        print(f"  Hindsight Status: {demo_result['hindsight_status']}")

    # 3. Test Dashboard Stats
    async with AsyncSessionLocal() as session:
        stats = await get_dashboard_stats(session)
        print("[OK] Dashboard stats retrieved successfully:")
        print(f"  Total Clients: {stats['total_clients']}")
        print(f"  Active Projects: {stats['active_projects']}")
        print(f"  Requests Analyzed: {stats['requests_analyzed']}")
        print(f"  Out of Scope: {stats['out_of_scope_requests']}")

if __name__ == "__main__":
    asyncio.run(run_tests())
