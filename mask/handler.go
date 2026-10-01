package mask

import (
	"context"
	"log/slog"
)

type Handler struct {
	next slog.Handler
}

func NewHandler(next slog.Handler) *Handler {
	return &Handler{next: next}
}

func (h *Handler) Enabled(ctx context.Context, level slog.Level) bool {
	return h.next.Enabled(ctx, level)
}

func (h *Handler) Handle(ctx context.Context, r slog.Record) error {
	out := slog.NewRecord(r.Time, r.Level, redactString(r.Message), r.PC)
	r.Attrs(func(a slog.Attr) bool {
		out.AddAttrs(redactAttr(a, 0))
		return true
	})
	return h.next.Handle(ctx, out)
}

func (h *Handler) WithAttrs(attrs []slog.Attr) slog.Handler {
	return &Handler{next: h.next.WithAttrs(redactAttrs(attrs, 0))}
}

func (h *Handler) WithGroup(name string) slog.Handler {
	return &Handler{next: h.next.WithGroup(redactString(name))}
}

func redactAttrs(attrs []slog.Attr, depth int) []slog.Attr {
	out := make([]slog.Attr, len(attrs))
	for i, a := range attrs {
		out[i] = redactAttr(a, depth)
	}
	return out
}

func redactAttr(a slog.Attr, depth int) slog.Attr {
	key := redactString(a.Key)
	v := a.Value.Resolve()
	switch v.Kind() {
	case slog.KindString:
		return slog.String(key, redactString(v.String()))
	case slog.KindGroup:
		if depth >= MaxDepth {
			return slog.String(key, markerDepth)
		}
		return slog.Attr{Key: key, Value: slog.GroupValue(redactAttrs(v.Group(), depth+1)...)}
	case slog.KindInt64:
		return slog.Attr{Key: key, Value: slog.AnyValue(redactInt(v.Int64(), v.Int64()))}
	case slog.KindUint64:
		return slog.Attr{Key: key, Value: slog.AnyValue(redactUint(v.Uint64(), v.Uint64()))}
	case slog.KindFloat64:
		return slog.Attr{Key: key, Value: slog.AnyValue(redactFloat(v.Float64()))}
	case slog.KindAny:
		return slog.Attr{Key: key, Value: slog.AnyValue(Redact(v.Any()))}
	default:
		return slog.Attr{Key: key, Value: v}
	}
}
