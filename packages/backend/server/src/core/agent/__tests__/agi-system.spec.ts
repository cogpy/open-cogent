import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from 'eventemitter2';

import { Config } from '../../base';
import { AGISystemService } from '../agi-system.service';
import {
  AgentLifecycleManager,
  AgentMemoryManager,
  AgentPlanningEngine,
  AgentCoordinationService,
} from '../agent';

describe('AGISystemService', () => {
  let service: AGISystemService;
  let lifecycleManager: AgentLifecycleManager;
  let memoryManager: AgentMemoryManager;
  let planningEngine: AgentPlanningEngine;
  let coordinationService: AgentCoordinationService;

  const mockConfig = {
    flags: {
      earlyAccessControl: false,
    },
  } as Config;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AGISystemService,
        AgentLifecycleManager,
        AgentMemoryManager,
        AgentPlanningEngine,
        AgentCoordinationService,
        {
          provide: Config,
          useValue: mockConfig,
        },
      ],
    }).compile();

    service = module.get<AGISystemService>(AGISystemService);
    lifecycleManager = module.get<AgentLifecycleManager>(AgentLifecycleManager);
    memoryManager = module.get<AgentMemoryManager>(AgentMemoryManager);
    planningEngine = module.get<AgentPlanningEngine>(AgentPlanningEngine);
    coordinationService = module.get<AgentCoordinationService>(
      AgentCoordinationService
    );
  });

  describe('System Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
      expect(lifecycleManager).toBeDefined();
      expect(memoryManager).toBeDefined();
      expect(planningEngine).toBeDefined();
      expect(coordinationService).toBeDefined();
    });

    it('should initialize system successfully', async () => {
      await expect(service.onModuleInit()).resolves.not.toThrow();
    });

    it('should get system status', () => {
      const status = service.getSystemStatus();

      expect(status).toHaveProperty('running');
      expect(status).toHaveProperty('metrics');
      expect(status).toHaveProperty('agents');
      expect(status).toHaveProperty('goals');
      expect(status).toHaveProperty('coordination');
      expect(status).toHaveProperty('config');
    });
  });

  describe('Agent Management', () => {
    it('should create a specialized agent', async () => {
      const agent = await service.createSpecializedAgent(
        'Test Agent',
        ['analysis', 'communication'],
        'Test agent for unit testing'
      );

      expect(agent).toBeDefined();
      expect(agent.name).toBe('Test Agent');
      expect(agent.capabilities).toHaveLength(2);
    });

    it('should submit a goal to the system', async () => {
      const goalId = await service.submitGoal(
        'Complete automated testing of the AGI system',
        8
      );

      expect(goalId).toBeDefined();
      expect(typeof goalId).toBe('string');
    });
  });

  describe('System Configuration', () => {
    it('should update system configuration', () => {
      const newConfig = {
        max_agents: 20,
        auto_spawn_agents: false,
        goal_discovery_enabled: true,
      };

      expect(() => service.updateConfig(newConfig)).not.toThrow();
    });
  });

  describe('System Lifecycle', () => {
    it('should start and stop the system', async () => {
      await expect(service.startSystem()).resolves.not.toThrow();
      await expect(service.stopSystem()).resolves.not.toThrow();
    });
  });
});

describe('AgentLifecycleManager', () => {
  let manager: AgentLifecycleManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AgentLifecycleManager],
    }).compile();

    manager = module.get<AgentLifecycleManager>(AgentLifecycleManager);
  });

  describe('Agent Creation', () => {
    it('should create an agent with valid configuration', async () => {
      const config = {
        name: 'Test Agent',
        type: 'test',
        capabilities: ['test_capability'],
        constraints: [],
        resources: [],
      };

      const agent = await manager.createAgent(config);

      expect(agent).toBeDefined();
      expect(agent.name).toBe('Test Agent');
      expect(agent.type).toBe('test');
      expect(manager.listAgents()).toContain(agent);
    });

    it('should get system statistics', () => {
      const stats = manager.getSystemStats();

      expect(stats).toHaveProperty('total_agents');
      expect(stats).toHaveProperty('status_distribution');
      expect(stats).toHaveProperty('type_distribution');
      expect(stats).toHaveProperty('timestamp');
    });
  });

  describe('Agent Lifecycle Operations', () => {
    it('should handle agent health checks', async () => {
      const health = await manager.healthCheck();

      expect(health).toHaveProperty('overall_health');
      expect(health).toHaveProperty('agent_count');
      expect(health).toHaveProperty('agents');
      expect(health).toHaveProperty('timestamp');
    });

    it('should perform emergency stop', async () => {
      await expect(manager.emergencyStop()).resolves.not.toThrow();
    });
  });
});

describe('AgentMemoryManager', () => {
  let manager: AgentMemoryManager;
  const testAgentId = 'test-agent-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AgentMemoryManager],
    }).compile();

    manager = module.get<AgentMemoryManager>(AgentMemoryManager);

    // Initialize memory for test agent
    manager.initializeMemory(testAgentId);
  });

  describe('Memory Operations', () => {
    it('should initialize agent memory', () => {
      const memory = manager.initializeMemory('new-agent-456');

      expect(memory).toHaveProperty('short_term');
      expect(memory).toHaveProperty('long_term');
      expect(memory).toHaveProperty('episodic');
      expect(memory).toHaveProperty('working_memory');
    });

    it('should store and retrieve knowledge', async () => {
      const knowledge = {
        id: 'test-knowledge-1',
        type: 'fact' as const,
        content: { fact: 'The sky is blue' },
        confidence: 0.9,
        source: 'test',
        timestamp: new Date(),
        tags: ['color', 'nature'],
      };

      await manager.storeKnowledge(testAgentId, knowledge);

      const retrieved = await manager.retrieveKnowledge(testAgentId, {
        keywords: ['sky'],
        limit: 5,
      });

      expect(retrieved).toHaveLength(1);
      expect(retrieved[0].content.fact).toBe('The sky is blue');
    });

    it('should get memory statistics', () => {
      const stats = manager.getMemoryStats(testAgentId);

      expect(stats).toHaveProperty('short_term_size');
      expect(stats).toHaveProperty('long_term_size');
      expect(stats).toHaveProperty('episodic_size');
      expect(stats).toHaveProperty('working_memory_size');
      expect(stats).toHaveProperty('last_updated');
    });

    it('should optimize memory', async () => {
      await expect(manager.optimizeMemory(testAgentId)).resolves.not.toThrow();
    });
  });
});

describe('AgentCoordinationService', () => {
  let service: AgentCoordinationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AgentCoordinationService],
    }).compile();

    service = module.get<AgentCoordinationService>(AgentCoordinationService);
  });

  describe('Coordination Operations', () => {
    it('should get coordination statistics', () => {
      const stats = service.getCoordinationStats();

      expect(stats).toHaveProperty('active_agents');
      expect(stats).toHaveProperty('active_tasks');
      expect(stats).toHaveProperty('active_teams');
      expect(stats).toHaveProperty('timestamp');
    });

    it('should broadcast messages', async () => {
      const message = {
        id: 'test-message-1',
        from: 'system',
        type: 'notification' as const,
        content: { message: 'Test broadcast' },
        timestamp: new Date(),
        priority: 1,
      };

      await expect(service.broadcastMessage(message)).resolves.not.toThrow();
    });
  });
});

describe('Integration Test: Complete AGI Workflow', () => {
  let agiSystem: AGISystemService;
  let lifecycleManager: AgentLifecycleManager;

  const mockConfig = {
    flags: { earlyAccessControl: false },
  } as Config;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AGISystemService,
        AgentLifecycleManager,
        AgentMemoryManager,
        AgentPlanningEngine,
        AgentCoordinationService,
        { provide: Config, useValue: mockConfig },
      ],
    }).compile();

    agiSystem = module.get<AGISystemService>(AGISystemService);
    lifecycleManager = module.get<AgentLifecycleManager>(AgentLifecycleManager);
  });

  it('should complete a full AGI workflow', async () => {
    // 1. Initialize system
    await agiSystem.onModuleInit();

    // 2. Start system
    await agiSystem.startSystem();

    // 3. Create an agent
    const agent = await agiSystem.createSpecializedAgent(
      'Integration Test Agent',
      ['analysis', 'problem_solving'],
      'Demonstrate AGI system capabilities'
    );

    expect(agent).toBeDefined();

    // 4. Submit a goal
    const goalId = await agiSystem.submitGoal(
      'Analyze system performance and suggest improvements',
      7
    );

    expect(goalId).toBeDefined();

    // 5. Check system status
    const status = agiSystem.getSystemStatus();
    expect(status.running).toBe(true);
    expect(status.agents.total).toBeGreaterThan(0);

    // 6. Verify agent is in the system
    const agents = lifecycleManager.listAgents();
    const createdAgent = agents.find(a => a.id === agent.id);
    expect(createdAgent).toBeDefined();

    // 7. Stop system
    await agiSystem.stopSystem();

    const finalStatus = agiSystem.getSystemStatus();
    expect(finalStatus.running).toBe(false);
  }, 30000); // Allow 30 seconds for the integration test
});
