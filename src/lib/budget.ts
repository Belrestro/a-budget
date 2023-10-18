import { v4 as randomUUID } from 'uuid';
import moment from 'moment';
import Heap from './Heap';

const DEFAULT_FORMAT = 'YYYY-MM-DD';
const steps = ['1 day', '1 week', '1 month'];

type UUID = ReturnType<typeof randomUUID>; 

type EventType = 'income' | 'expense';

class Effect {
  references: UUID[] = [];

  constructor(public date: string, public change: number = 0, public totalAmount: number = 0) {}

  add(amount: number) {
    this.change += amount;
    this.totalAmount += this.change;
  }

  link(id: UUID) {
    this.references.push(id);
  }

  continue(date: string) {
    return new Effect(date, 0, this.totalAmount);
  }
};

class BudgetEvent {
  id: UUID;

  constructor(public type: EventType, private amount: number, public startDate: string, private repeatAt?: string) {
    this.id = randomUUID();
  }

  getAmount() {
    const sign = this.type === 'expense' ? -1 : 1;
    return Math.abs(this.amount) * sign;
  }

  repeat() {
    if (!this.repeatAt) {
      return null;
    }
    const step = steps.includes(this.repeatAt) ? this.repeatAt : steps[0];
    const startDate = moment(this.startDate).add(...step.split(' '))
    return new BudgetEvent(this.type, this.amount, startDate.format(DEFAULT_FORMAT), this.repeatAt);
  }
};

export class IncomeEvent extends BudgetEvent {
  constructor(amount: number, startDate: string, repeatAt?: string) {
    super('income', amount, startDate, repeatAt);
  }
}

export class ExpenseEvent extends BudgetEvent {
  constructor(amount: number, startDate: string, repeatAt?: string) {
    super('expense', amount, startDate, repeatAt);
  }
}


export class Budget {
  events = new Heap<BudgetEvent>((a, b) => moment(a.startDate).isBefore(b.startDate) ? 1 : -1);
  eventIds = new Map<UUID, BudgetEvent>();
  effects: Effect[] = [];

  addEvent(event: BudgetEvent) {
    if (this.eventIds.has(event.id)) {
      return;
    }
    this.events.push(event);
    this.eventIds.set(event.id, event);
  }

  private propagateEffects(step: string, startDate: string, endDate: string) {
    if (moment(startDate).isSameOrAfter(endDate)) {
      throw new Error(`Invalid date range s: ${startDate} e: ${endDate}`);
    }
    const heap = this.events.clone();
    step = steps.includes(step) ? step : steps[0];
    let currentDate = moment(startDate);
    let nextDate = moment(currentDate).add(...step.split(' '));
    const draggers = [];
    let accumulator: Effect = new Effect(currentDate.format(DEFAULT_FORMAT), 0);
    const effects: Effect[] = [accumulator];
    let event = heap.pop();

    while (nextDate.isBefore(endDate)) {
      if (!event || nextDate.isSameOrBefore(event.startDate)) {
        currentDate = nextDate;
        nextDate = moment(currentDate).add(...step.split(' '));
        accumulator = accumulator.continue(currentDate.format(DEFAULT_FORMAT));
        effects.push(accumulator);
      }
      if (event && moment(event?.startDate).isSameOrAfter(currentDate)) {
        accumulator.add(event.getAmount());
        accumulator.link(event.id);
  
        const repeated = event.repeat();
  
        if (repeated) {
          heap.push(repeated);
        }
        event = heap.pop();
      }
    }
    
    return effects;
  }

  breakdown(step: string = '1 week', startDate: string, endDate?: string) {
    const anchorDate = moment(startDate);
    const finishDate = endDate ? moment(endDate) : moment(anchorDate).add('6', 'month');
    const effects = this.propagateEffects(step, anchorDate.format(DEFAULT_FORMAT), finishDate.format(DEFAULT_FORMAT));

    return effects;
  }
}

console.log('start');

const budget = new Budget();

budget.addEvent(new IncomeEvent(1000, '2023-10-18'));

budget.addEvent(new ExpenseEvent(50, '2023-10-19'));

budget.addEvent(new ExpenseEvent(12, '2023-10-20'));

console.log(budget.breakdown('1 day', '2023-10-15', '2023-10-23'));


