import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@/__tests__/utils/render"
import { DataTable, DataTableColumn } from "@/components/shared/DataTable"

interface TestItem {
  id: number
  name: string
  email: string
}

const testColumns: DataTableColumn<TestItem>[] = [
  { key: "name", label: "Nome" },
  { key: "email", label: "Email" }
]

const testData: TestItem[] = [
  { id: 1, name: "Alice", email: "alice@example.com" },
  { id: 2, name: "Bob", email: "bob@example.com" }
]

describe("DataTable", () => {
  it("renders column headers", () => {
    render(<DataTable data={testData} columns={testColumns} />)

    expect(screen.getByText("Nome")).toBeInTheDocument()
    expect(screen.getByText("Email")).toBeInTheDocument()
  })

  it("renders data rows with custom render functions", () => {
    const columnsWithRender: DataTableColumn<TestItem>[] = [
      {
        key: "name",
        label: "Nome",
        render: (item) => <span data-testid="custom-name">{item.name}</span>
      },
      { key: "email", label: "Email" }
    ]

    render(<DataTable data={testData} columns={columnsWithRender} />)

    const customNames = screen.getAllByTestId("custom-name")
    expect(customNames).toHaveLength(2)
    expect(customNames[0]).toHaveTextContent("Alice")
    expect(customNames[1]).toHaveTextContent("Bob")
  })

  it("calls onRowClick when row is clicked", async () => {
    const handleRowClick = vi.fn()

    render(
      <DataTable
        data={testData}
        columns={testColumns}
        onRowClick={handleRowClick}
      />
    )

    const firstRow = screen.getByText("Alice").closest("tr")
    firstRow?.click()

    expect(handleRowClick).toHaveBeenCalledTimes(1)
    expect(handleRowClick).toHaveBeenCalledWith(testData[0])
  })

  it("shows loading skeleton when isLoading=true", () => {
    const { container } = render(
      <DataTable data={[]} columns={testColumns} isLoading={true} />
    )

    const pulsingElements = container.querySelectorAll(".animate-pulse")
    expect(pulsingElements.length).toBeGreaterThan(0)
  })

  it("shows empty message when data is empty", () => {
    render(<DataTable data={[]} columns={testColumns} />)

    expect(screen.getByText("Nenhum registro encontrado")).toBeInTheDocument()
  })

  it("shows custom empty message when data is empty", () => {
    render(
      <DataTable
        data={[]}
        columns={testColumns}
        emptyMessage="Nenhum contato encontrado"
      />
    )

    expect(
      screen.getByText("Nenhum contato encontrado")
    ).toBeInTheDocument()
  })
})
