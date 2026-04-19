import plotly.graph_objects as go
import plotly.io as pio


def generate_charts(results: dict) -> dict:
    monthly_chart = _monthly_chart(results["monthly"])
    hourly_chart = _hourly_chart(results["hourly_heatmap"])
    per_tree_chart = _per_tree_chart(results["per_tree"])

    return {
        "monthly": pio.to_json(monthly_chart, remove_uids=True),
        "hourly": pio.to_json(hourly_chart, remove_uids=True),
        "per_tree": pio.to_json(per_tree_chart, remove_uids=True),
    }


def _monthly_chart(monthly: list[dict]) -> go.Figure:
    labels = [m["month_name"] for m in monthly]
    raw = [m["shade_pct_raw"] for m in monthly]
    irr = [m["shade_pct_irradiance"] for m in monthly]

    fig = go.Figure()
    fig.add_trace(go.Bar(
        name="Raw hours shaded %",
        x=labels, y=raw,
        marker_color="#94a3b8",
    ))
    fig.add_trace(go.Bar(
        name="Irradiance-weighted %",
        x=labels, y=irr,
        marker_color="#f59e0b",
    ))
    fig.update_layout(
        barmode="group",
        title="Monthly Shading",
        xaxis_title="Month",
        yaxis_title="Shading %",
        legend=dict(orientation="h", y=-0.2),
        margin=dict(l=40, r=20, t=40, b=60),
        plot_bgcolor="white",
        paper_bgcolor="white",
        font=dict(family="Inter, sans-serif", size=12),
    )
    return fig


def _hourly_chart(hourly: dict) -> go.Figure:
    z = hourly["z"]
    x_labels = hourly["x_labels"]
    y_labels = hourly["y_labels"]

    fig = go.Figure(go.Heatmap(
        z=z,
        x=x_labels,
        y=y_labels,
        colorscale=[[0, "#fef9c3"], [1, "#b45309"]],
        zmin=0, zmax=1,
        colorbar=dict(title="Shade fraction"),
    ))
    fig.update_layout(
        title="Hourly Shading Heatmap",
        xaxis_title="Date",
        yaxis_title="Hour",
        margin=dict(l=60, r=20, t=40, b=40),
        plot_bgcolor="white",
        paper_bgcolor="white",
        font=dict(family="Inter, sans-serif", size=11),
    )
    return fig


def _per_tree_chart(per_tree: list[dict]) -> go.Figure:
    if not per_tree:
        fig = go.Figure()
        fig.update_layout(title="Per-Tree Impact (no trees)")
        return fig

    names = [t["name"] for t in per_tree]
    raw = [t["shade_pct_raw"] for t in per_tree]
    irr = [t["shade_pct_irradiance"] for t in per_tree]

    fig = go.Figure()
    fig.add_trace(go.Bar(
        name="Raw hours %",
        y=names, x=raw,
        orientation="h",
        marker_color="#94a3b8",
    ))
    fig.add_trace(go.Bar(
        name="Irradiance-weighted %",
        y=names, x=irr,
        orientation="h",
        marker_color="#f59e0b",
    ))
    fig.update_layout(
        barmode="group",
        title="Per-Tree Shading Impact",
        xaxis_title="Shading %",
        legend=dict(orientation="h", y=-0.2),
        margin=dict(l=100, r=20, t=40, b=60),
        plot_bgcolor="white",
        paper_bgcolor="white",
        font=dict(family="Inter, sans-serif", size=12),
        height=max(200, len(per_tree) * 60 + 120),
    )
    return fig
