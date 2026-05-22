import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    let todos;
    if (category) {
      todos = query.getTodosByCategory.all(category);
    } else {
      todos = query.getAllTodos.all();
    }
    
    return NextResponse.json({ success: true, data: todos });
  } catch (error) {
    console.error('Get todos error:', error);
    return NextResponse.json({ success: false, error: '获取待办事项失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, name, industry, level, source, phone, address, remark, creator, department, owner } = body;
    
    query.createTodo.run(category, name, industry, level, source, phone, address, remark, creator, department, owner);
    
    return NextResponse.json({ success: true, message: '创建成功' });
  } catch (error) {
    console.error('Create todo error:', error);
    return NextResponse.json({ success: false, error: '创建失败' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;
    
    query.updateTodo.run(id);
    
    return NextResponse.json({ success: true, message: '已标记为已处理' });
  } catch (error) {
    console.error('Update todo error:', error);
    return NextResponse.json({ success: false, error: '更新失败' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ success: false, error: '缺少ID' }, { status: 400 });
    }
    
    query.deleteTodo.run(parseInt(id));
    
    return NextResponse.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('Delete todo error:', error);
    return NextResponse.json({ success: false, error: '删除失败' }, { status: 500 });
  }
}
