import React from 'react';
import { Route, Switch } from 'react-router-dom';
import PromptGenerate from './pages/PromptGenerate';
import CollaborationSpace from './pages/CollaborationSpace';
import VariableLibrary from './pages/VariableLibrary';

const Routes = () => {
  return (
    <Switch>
      <Route exact path="/" component={PromptGenerate} /> // 默认路由指向 PromptGenerate
      <Route path="/prompt-generate" component={PromptGenerate} />
      <Route path="/collaboration-space" component={CollaborationSpace} />
      <Route path="/variable-library" component={VariableLibrary} />
      {/* 其他路由配置 */}
    </Switch>
  );
};

export default Routes;