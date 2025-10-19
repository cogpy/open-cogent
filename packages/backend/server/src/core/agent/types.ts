import { EventEmitter } from 'events';
import { Observable } from 'rxjs';

/**
 * Agent status representing its current operational state
 */
export enum AgentStatus {
  INITIALIZING = 'initializing',
  IDLE = 'idle',
  PLANNING = 'planning',
  EXECUTING = 'executing',
  LEARNING = 'learning',
  COMMUNICATING = 'communicating',
  PAUSED = 'paused',
  ERROR = 'error',
  TERMINATED = 'terminated',
}

/**
 * Agent capabilities define what an agent can do
 */
export interface AgentCapability {
  name: string;
  description: string;
  parameters?: Record<string, any>;
  execute: (params: any, context: AgentContext) => Promise<any>;
}

/**
 * Agent context provides the operational environment
 */
export interface AgentContext {
  userId: string;
  sessionId: string;
  workspaceId?: string;
  environment: Record<string, any>;
  constraints: AgentConstraint[];
  resources: AgentResource[];
}

/**
 * Agent constraints define behavioral boundaries
 */
export interface AgentConstraint {
  type: 'safety' | 'resource' | 'time' | 'permission' | 'ethical';
  description: string;
  rule: (action: AgentAction, context: AgentContext) => boolean;
}

/**
 * Agent resources define available tools and systems
 */
export interface AgentResource {
  type: 'api' | 'database' | 'file_system' | 'external_service';
  name: string;
  endpoint?: string;
  credentials?: Record<string, string>;
  permissions: string[];
}

/**
 * Agent actions represent atomic operations
 */
export interface AgentAction {
  id: string;
  type: string;
  description: string;
  parameters: Record<string, any>;
  expectedOutcome?: string;
  preconditions?: string[];
  timestamp: Date;
}

/**
 * Agent goals represent high-level objectives
 */
export interface AgentGoal {
  id: string;
  description: string;
  priority: number;
  deadline?: Date;
  success_criteria: string[];
  progress: number;
  status: 'pending' | 'active' | 'completed' | 'failed' | 'cancelled';
  subgoals?: AgentGoal[];
}

/**
 * Agent memory stores experiences and knowledge
 */
export interface AgentMemory {
  short_term: Record<string, any>;
  long_term: AgentKnowledge[];
  episodic: AgentExperience[];
  working_memory: any[];
}

/**
 * Agent knowledge represents learned information
 */
export interface AgentKnowledge {
  id: string;
  type: 'fact' | 'rule' | 'procedure' | 'concept';
  content: any;
  confidence: number;
  source: string;
  timestamp: Date;
  tags: string[];
}

/**
 * Agent experiences represent past interactions
 */
export interface AgentExperience {
  id: string;
  context: Partial<AgentContext>;
  action: AgentAction;
  outcome: any;
  success: boolean;
  timestamp: Date;
  lessons_learned?: string[];
}

/**
 * Agent plan represents a sequence of actions to achieve goals
 */
export interface AgentPlan {
  id: string;
  goal_id: string;
  actions: AgentAction[];
  estimated_duration: number;
  risk_assessment: number;
  alternatives?: AgentPlan[];
  status: 'draft' | 'approved' | 'executing' | 'completed' | 'failed';
}

/**
 * Main Agent interface defining autonomous AI agent
 */
export interface Agent extends EventEmitter {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly status: AgentStatus;
  readonly capabilities: AgentCapability[];
  readonly context: AgentContext;
  readonly goals: AgentGoal[];
  readonly memory: AgentMemory;
  readonly currentPlan?: AgentPlan;

  // Lifecycle methods
  initialize(context: AgentContext): Promise<void>;
  start(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  terminate(): Promise<void>;

  // Core AGI functions
  perceive(): Promise<any[]>;
  plan(goal: AgentGoal): Promise<AgentPlan>;
  execute(action: AgentAction): Promise<any>;
  learn(experience: AgentExperience): Promise<void>;
  communicate(message: any, target?: Agent): Promise<any>;

  // Decision making
  evaluate(options: any[]): Promise<any>;
  decide(context: any): Promise<AgentAction>;

  // Goal management
  addGoal(goal: AgentGoal): Promise<void>;
  removeGoal(goalId: string): Promise<void>;
  prioritizeGoals(): Promise<void>;

  // Memory management
  remember(knowledge: AgentKnowledge): Promise<void>;
  recall(query: any): Promise<AgentKnowledge[]>;
  forget(criteria: any): Promise<void>;

  // Observability
  getStatus(): AgentStatus;
  getMetrics(): Record<string, any>;
  getLogs(): any[];
}

/**
 * Agent configuration for initialization
 */
export interface AgentConfig {
  name: string;
  type: string;
  capabilities: string[];
  constraints: AgentConstraint[];
  resources: AgentResource[];
  initial_goals?: AgentGoal[];
  memory_config?: {
    short_term_capacity: number;
    long_term_retention_policy: string;
    episodic_memory_limit: number;
  };
}

/**
 * Multi-agent system coordination messages
 */
export interface AgentMessage {
  id: string;
  from: string;
  to: string | 'broadcast';
  type: 'request' | 'response' | 'notification' | 'coordination';
  content: any;
  timestamp: Date;
  priority: number;
}

/**
 * Agent coordination protocol
 */
export interface AgentCoordination {
  negotiate(agents: Agent[], task: any): Promise<Agent[]>;
  delegate(task: any, agent: Agent): Promise<any>;
  collaborate(agents: Agent[], goal: AgentGoal): Promise<AgentPlan>;
  resolve_conflict(conflict: any): Promise<any>;
}

/**
 * Observable streams for real-time monitoring
 */
export interface AgentObservables {
  status$: Observable<AgentStatus>;
  actions$: Observable<AgentAction>;
  goals$: Observable<AgentGoal>;
  messages$: Observable<AgentMessage>;
  metrics$: Observable<Record<string, any>>;
}
