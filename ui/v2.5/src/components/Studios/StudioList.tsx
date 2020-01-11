import React, { FunctionComponent } from "react";
import { QueryHookResult } from "react-apollo-hooks";
import { FindStudiosQuery, FindStudiosVariables } from "src/core/generated-graphql";
import { ListHook } from "src/hooks";
import { IBaseProps } from "src/models/base-props";
import { ListFilterModel } from "src/models/list-filter/filter";
import { DisplayMode, FilterMode } from "src/models/list-filter/types";
import { StudioCard } from "./StudioCard";

interface IProps extends IBaseProps {}

export const StudioList: FunctionComponent<IProps> = (props: IProps) => {
  const listData = ListHook.useList({
    filterMode: FilterMode.Studios,
    props,
    renderContent,
  });

  function renderContent(result: QueryHookResult<FindStudiosQuery, FindStudiosVariables>, filter: ListFilterModel) {
    if (!result.data || !result.data.findStudios) { return; }
    if (filter.displayMode === DisplayMode.Grid) {
      return (
        <div className="grid">
          {result.data.findStudios.studios.map((studio) => (<StudioCard key={studio.id} studio={studio} />))}
        </div>
      );
    } else if (filter.displayMode === DisplayMode.List) {
      return <h1>TODO</h1>;
    } else if (filter.displayMode === DisplayMode.Wall) {
      return <h1>TODO</h1>;
    }
  }

  return listData.template;
};
