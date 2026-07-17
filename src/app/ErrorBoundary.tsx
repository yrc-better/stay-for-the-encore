import { Component, type ErrorInfo, type ReactNode } from "react";
import { WarningCircleIcon } from "@phosphor-icons/react";
import { Button, Panel } from "../components";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Band simulator render failure", error, info);
  }

  render(): ReactNode {
    if (!this.state.error) return this.props.children;

    return (
      <main className="app-error-boundary">
        <Panel title="后台工作站暂时无法打开" eyebrow="恢复模式" accent>
          <WarningCircleIcon size={34} weight="duotone" aria-hidden="true" />
          <p>
            当前页面遇到了异常。你的本地存档不会被自动删除，可以先重新载入页面。
          </p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            重新载入
          </Button>
          <details>
            <summary>诊断信息</summary>
            <code>{this.state.error.message}</code>
          </details>
        </Panel>
      </main>
    );
  }
}
