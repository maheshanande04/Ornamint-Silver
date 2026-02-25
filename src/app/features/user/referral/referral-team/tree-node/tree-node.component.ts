import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface TreeUserNode {
  user_id: number;
  email: string;
  username: string;
  isContractHolder: number;
  children?: TreeUserNode[];
  expanded?: boolean;
  loaded?: boolean;
}

@Component({
  selector: 'app-tree-node',
  templateUrl: './tree-node.component.html',
  styleUrls: ['./tree-node.component.css']
})
export class TreeNodeComponent {
  @Input() node!: TreeUserNode;
  @Input() loadingUserId: number | null = null;
  @Output() nodeClick = new EventEmitter<TreeUserNode>();

  onNodeClick(n: TreeUserNode): void {
    this.nodeClick.emit(n);
  }
}
