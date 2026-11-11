import React from 'react';

export class AppErrorBoundary extends React.Component<{children:React.ReactNode},{error:string|null}>{
state={error:null as string|null};
static getDerivedStateFromError(error:Error){return {error:error.message||String(error)}}
componentDidCatch(error:Error,info:React.ErrorInfo){console.error('EmpEval render failed',error,info.componentStack)}
render(){if(this.state.error)return <div style={{padding:32,fontFamily:'system-ui',color:'#222b45'}}><h1>EmpEval could not render</h1><p>Runtime error: {this.state.error}</p><button onClick={()=>window.location.reload()}>Reload / โหลดใหม่</button><p>Please share this error message so it can be fixed. / กรุณาส่งข้อความข้อผิดพลาดนี้เพื่อให้ตรวจสอบและแก้ไข</p></div>;return this.props.children}
}
