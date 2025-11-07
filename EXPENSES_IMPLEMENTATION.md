# Expenses & Profit/Loss Module - Implementation Summary

## User Request
"Ik heb ook flink geinvesteerd in cursussen en het materiaal dat wil ik kunnen opgeven zodat ik ook zie hoeveel ik in de min sta enzovoort en mocht ik zeep bij kopen of what ever dan krijg ik inzicht in mijn marges"

**Translation**: I've invested a lot in courses and materials. I want to be able to track that so I can see how much I'm in the red, and if I buy soap or whatever, I get insight into my margins.

**User Priorities** (from follow-up):
1. All 3 calculations (profit/loss, break-even, net margin) ✅
2. General expenses page - Yes ✅
3. One-time investments (courses, equipment) - Yes, keep it simple ✅

## Implementation

### NEW Expense Model
```typescript
export type ExpenseType = 'INVESTMENT' | 'EQUIPMENT' | 'COURSE' | 'OTHER';

export interface Expense {
  id?: string;
  description: string;
  amount: number;
  date: Date;
  type: ExpenseType;
  notes?: string;
  deletedAt?: Date;
}
```

### NEW Expenses Page (`/expenses`)
- **List View**: All expenses with totals
- **Add/Edit Form**: Simple form for expense entry
- **Fields**:
  - Description (required)
  - Amount in € (required)
  - Date (required)
  - Type: Cursus/Apparatuur/Investering/Overig (required)
  - Notes (optional)
- **Actions**: Add, Edit, Delete (soft delete)
- **Summary**: Total expenses and count

### Enhanced Reports Page
Added 4 new financial cards:

#### 1. Totale Uitgaven (Total Expenses)
- Sum of all expenses
- Count of expense entries
- **Color**: Red (cost indicator)

#### 2. Netto Winst (Net Profit)
- Formula: `Total Revenue - Total Expenses`
- **Green** if positive (profitable)
- **Red** if negative ("in de min")
- Shows break-even status with icon

#### 3. Winstmarge (Profit Margin)
- Formula: `(Net Profit / Total Revenue) × 100%`
- **Green/Red** based on profitability
- Quality indicators:
  - Uitstekend (Excellent): ≥30%
  - Goed (Good): 15-30%
  - Matig (Moderate): 0-15%
  - Verliesgevend (Loss-making): <0%

#### 4. Break-Even Punt (Break-Even Point)
- Shows minimum revenue needed
- **Status**: "Break-even bereikt" or amount still needed
- Helps track progress to profitability

## Financial Calculations

### Expense Report
```typescript
interface ExpenseReport {
  period: ReportPeriod;
  totalExpenses: number;
  expenseCount: number;
  averageExpense: number;
}
```

### Profit/Loss Report
```typescript
interface ProfitLossReport {
  period: ReportPeriod;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;           // Revenue - Expenses
  profitMargin: number;         // (Profit / Revenue) × 100%
  breakEven: boolean;           // Profit >= 0
}
```

## User Workflows

### Track an Investment/Expense
1. Click "Uitgaven" in navigation
2. Click "Nieuwe Uitgave" button
3. Enter details:
   - Example: "Hondentrimsalon Cursus"
   - €1,500
   - Date: when purchased
   - Type: "Cursus"
   - Notes: "Professionele trimcursus Amsterdam"
4. Click "Opslaan"
5. See total expenses update

### View Profitability
1. Click "Rapportages" in navigation
2. Select period (week/month/quarter/year)
3. **Dashboard shows**:
   - Total Revenue: €5,000
   - Total Expenses: €3,000
   - **Netto Winst: €2,000** (green - profitable!)
   - **Winstmarge: 40%** (Uitstekend)
   - Break-even: ✅ Bereikt

### Example: In the Red Scenario
If expenses exceed revenue:
- Revenue: €500
- Expenses: €1,500
- **Netto Winst: -€1,000** (red - in de min!)
- **Winstmarge: -200%** (Verliesgevend)
- Break-even: ❌ Nog €1,000 nodig

## Business Insights

### What You Can Now See
1. **Total Investment**: All courses, equipment costs tracked
2. **Profitability Status**: Are you making money or losing money?
3. **Break-Even Progress**: How far from profitability?
4. **Margin Quality**: Is the business financially healthy?
5. **Trend Analysis**: Compare periods to see improvement

### Decision Support
- **Pricing Decisions**: If margin is low, consider raising prices
- **Cost Control**: See where expenses are going
- **Investment ROI**: Track if investments (courses) pay off
- **Growth Planning**: Know when you can afford to expand

## Technical Implementation

### Services
- `ExpenseService`: CRUD operations for expenses
- `ReportService`: Enhanced with expense and P&L calculations

### Routes
- `/expenses` - List all expenses
- `/expenses/new` - Add new expense
- `/expenses/:id` - Edit expense

### Data Storage
- Firebase Firestore collection: `expenses`
- Soft deletes (deletedAt field)
- Date-range filtering for reports

### UI Components
- PrimeNG Table for expenses list
- PrimeNG Card for dashboard metrics
- Color-coded indicators (green/red)
- Icons for status (✅/❌)
- Responsive design

## Example Use Cases

### Case 1: Track Course Investment
- Add expense: "Hondentrimsalon Masterclass" - €2,000
- Over 3 months, earn €8,000 revenue
- **Result**: Profit €6,000, Margin 75% (Uitstekend)
- **Insight**: Course paid for itself!

### Case 2: Monitor Supplies
- Add expense: "Shampoo & Zeep Voorraad" - €150
- Monthly revenue: €3,500
- Monthly expenses (total): €800
- **Result**: Profit €2,700, Margin 77% (Uitstekend)
- **Insight**: Healthy margins, business is profitable

### Case 3: Startup Phase
- Total investments: €5,000 (equipment, courses)
- First month revenue: €1,200
- **Result**: Profit -€3,800 (in de min)
- Break-even: Nog €3,800 nodig
- **Insight**: Clear target to reach profitability

## Integration with Existing Features

Works seamlessly with:
- **Hourly Rate Tracking**: See if €60/hr target supports profitability
- **Appointment Pricing**: Revenue side of profit calculation
- **Reports Period Selection**: Same time ranges for consistency
- **Financial Dashboard**: Unified view of business health

## Future Enhancements (Not Implemented)

Potential additions if needed:
- Recurring expense tracking (monthly costs)
- Per-appointment material costs
- Expense categories and tags
- Budget planning and alerts
- Export expenses to accounting software
- Tax deduction tracking

## Summary

**Problem**: User couldn't track business costs and didn't know profitability
**Solution**: Complete expenses module with profit/loss analysis
**Result**: Full financial visibility - "in de min" or profitable, with margins

User can now:
✅ Track all investments (courses, equipment)
✅ See total expenses
✅ Calculate net profit/loss
✅ Monitor profit margins
✅ Track break-even status
✅ Make informed business decisions

**Implementation**: Simple, focused, effective - exactly as requested "keep it simple"
