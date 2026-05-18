export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface ChatRequest {
  message: string;
  cart: CartItem[];
}

export interface ChatChoice {
  id: string;
  name: string;
}

export interface PendingAction {
  action: 'add' | 'remove' | 'update';
  quantity?: number;
}

export interface ActionStep {
  action: 'add' | 'remove' | 'update' | 'clear' | 'none';
  item?: string;
  quantity?: number;
  choices?: ChatChoice[];
  pendingAction?: PendingAction;
}

export interface ChatResponse {
  steps: ActionStep[];
  response: string;
}

export interface MenuResponse {
  data: MenuItem[];
}

export class AppError extends Error {
  code: string;
  status: number;

  constructor(code: string, status: number, message: string) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
