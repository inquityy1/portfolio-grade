import React from 'react'
import { render, screen } from '@testing-library/react'
import { Table, TableColumn } from './Table'

interface TestDataItem {
  id: number
  name: string
  age: number
  email: string
  status: 'active' | 'inactive'
}

describe('Table', () => {
  const defaultColumns: TableColumn<TestDataItem>[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'age', label: 'Age' },
    { key: 'email', label: 'Email' },
    {
      key: 'status',
      label: 'Status',
      render: (value: string, item: TestDataItem) => (
        <span data-testid={`status-${item.id}`}>
          {item.status}
        </span>
      )
    },
  ]

  const defaultData: TestDataItem[] = [
    { id: 1, name: 'John Doe', age: 30, email: 'john@example.com', status: 'active' },
    { id: 2, name: 'Jane Smith', age: 25, email: 'jane@example.com', status: 'inactive' },
    { id: 3, name: 'Bob Johnson', age: 35, email: 'bob@example.com', status: 'active' },
  ]

  it('should render without crashing', () => {
    render(<Table columns={defaultColumns} data={defaultData} />)
    expect(screen.getByText('ID')).toBeTruthy()
  })

  it('should render table headers', () => {
    render(<Table columns={defaultColumns} data={defaultData} />)
    expect(screen.getByText('ID')).toBeTruthy()
    expect(screen.getByText('Name')).toBeTruthy()
    expect(screen.getByText('Age')).toBeTruthy()
    expect(screen.getByText('Email')).toBeTruthy()
    expect(screen.getByText('Status')).toBeTruthy()
  })

  it('should render table data', () => {
    render(<Table columns={defaultColumns} data={defaultData} />)
    expect(screen.getByText('John Doe')).toBeTruthy()
    expect(screen.getByText('Jane Smith')).toBeTruthy()
    expect(screen.getByText('Bob Johnson')).toBeTruthy()
  })

  it('should use custom render functions for columns', () => {
    render(<Table columns={defaultColumns} data={defaultData} />)
    const status1 = screen.getByTestId('status-1')
    const status2 = screen.getByTestId('status-2')
    const status3 = screen.getByTestId('status-3')

    expect(status1.textContent).toBe('active')
    expect(status2.textContent).toBe('inactive')
    expect(status3.textContent).toBe('active')
  })

  it('should show empty message when no data', () => {
    render(<Table columns={defaultColumns} data={[]} emptyMessage="No data available" />)
    expect(screen.getByText('No data available')).toBeTruthy()
  })

  it('should render without crashing when columns array is empty', () => {
    render(<Table columns={[]} data={[{ id: 1, name: 'Test' }]} />)
    // Should still render without crashing - no empty message shown when there's data
    const container = document.querySelector('.table-container')
    expect(container).toBeTruthy()
  })

  it('should accept className prop', () => {
    const { container } = render(<Table className="custom-table" columns={defaultColumns} data={defaultData} />)
    const firstChild = container.firstChild as HTMLElement
    expect(firstChild).toBeTruthy()
    expect(firstChild.classList.contains('custom-table')).toBe(true)
  })

  it('should handle onRowClick events', () => {
    const handleRowClick = jest.fn()
    render(<Table columns={defaultColumns} data={defaultData} onRowClick={handleRowClick} />)

    const firstRow = screen.getByText('John Doe').closest('tr')
    if (firstRow) {
      firstRow.click()
      expect(handleRowClick).toHaveBeenCalledWith(expect.objectContaining({
        id: 1,
        name: 'John Doe',
        age: 30,
        email: 'john@example.com',
        status: 'active'
      }))
    }
  })

  it('should handle different themes', () => {
    render(<Table columns={defaultColumns} data={defaultData} theme="dark" />)
    // Should render without errors
    expect(screen.getByText('John Doe')).toBeTruthy()
  })
})